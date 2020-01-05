/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/
'use strict';


/*
 * This module uses the singleton pattern to provide an object that implements the API
 * used by registered accounts to access the Bali Nebula™. The implementation requires
 * that objects implementing the digital notary API, the document repository API, and
 * the procedure compiler API be passed into the constructor.
 */
const bali = require('bali-component-framework');
const EOF = '\n';


/**
 * This function returns an object that implements the API for the Bali Nebula™.
 *
 * @param {Object} notary An object that implements the API for the digital notary.
 * @param {Object} repository An object that implements the API for the document repository.
 * @param {Object} compiler An object that implements the API for the procedure compiler.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} An object that implements the API for the Bali Nebula™.
 */
exports.api = function(notary, repository, compiler, debug) {
    // validate the parameters
    debug = debug || false;

    // TODO: these need to be shared with the virtual machine
    const SEND_QUEUE_ID = 'JXT095QY01HBLHPAW04ZR5WSH41MWG4H';
    const EVENT_QUEUE_ID = '3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43';

    // return a singleton object for the API
    return {

        /**
         * This function returns a string providing attributes about this repository.
         * 
         * @returns {String} A string providing attributes about this repository.
         */
        toString: function() {
            const catalog = bali.catalog({
                $module: '/bali/services/NebulaAPI',
                $accountTag: this.getAccountTag(),
                $url: this.getURI()
            });
            return catalog.toString();
        },

        /**
         * This function returns the unique tag for the account that owns the notary key
         * for this client.
         * 
         * @returns {Tag} The unique tag for the account that owns the notary key for
         * this client.
         */
        getAccountTag: function() {
            return notary.getAccountTag();
        },

        /**
         * This function returns a reference to the document repository that is used by this
         * client.
         * 
         * @returns {Reference} A reference to the document repository that is used by this
         * client.
         */
        getURI: function() {
            return repository.getURI();
        },

        /**
         * This function registers a new account with the Bali Nebula™. A valid account is
         * required for general access to the Bali Nebula™.
         * 
         * @param {Catalog} information A catalog containing the account information.
         */
        registerAccount: async function(information) {
            try {
                // generate the initial notary key and certificate
                const certificate = notary.generateKey();
                const certificateId = extractId(certificate);

                // create the account document
                const accountTag = notary.getAccountTag();
                const account = bali.catalog({
                    $accountTag: accountTag
                }, bali.parameters({
                    $type: '/bali/composites/Account/v1',
                    $tag: accountTag,
                    $version: bali.version(),
                    $permissions: '/bali/permissions/private/v1',
                    $previous: bali.pattern.NONE
                }));
                account.addItems(information);

                // make sure the account doesn't already exist
                const accountId = extractId(account);
                if (await repository.documentExists(accountId)) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$registerAccount',
                        $exception: '$versionExists',
                        $accountId: accountId,
                        $text: bali.text('A committed version of the account already exists.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }

                // sign the account document
                const document = notary.signComponent(account);

                // create the documents in the repository
                await repository.createDocument(certificateId, certificate);
                await repository.createDocument(accountId, document);

            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$registerAccount',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to register a new account.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        activateAccount: async function(certificate) {

        },

        /**
         * This function associates the specified global name to the specified document
         * citation.
         * 
         * @param {Name} name The global name to be associated with the specified document
         * citation.
         * @param {Catalog} citation The document citation to be named.
         */
        nameCitation: async function(name, citation) {
            try {
                validateParameter('$nameCitation', 'name', name, 'name', debug);
                validateParameter('$nameCitation', 'citation', citation, 'citation', debug);
                if (cache.citationExists(name) || await repository.citationExists(name)) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$nameCitation',
                        $exception: '$nameExists',
                        $name: name,
                        $text: bali.text('The citation name already exists.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                await repository.createCitation(name, citation);
                cache.createCitation(name, citation);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$nameCitation',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $name: name,
                    $text: bali.text('An unexpected error occurred while attempting to retrieve a named citation.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method retrieves from the Bali Nebula™ the document citation associated with
         * the specified name.
         * 
         * @param {Name} name The globally unique name for the desired document citation.
         * @returns {Catalog} The document citation associated with the name.
         */
        retrieveCitation: async function(name) {
            try {
                validateParameter('$retrieveCitation', 'name', name, 'name', debug);
                var citation = cache.fetchCitation(name);
                if (!citation) {
                    const source = await repository.fetchCitation(name);
                    if (source) {
                        citation = bali.parse(source);
                        cache.createCitation(name, citation);
                    }
                }
                return citation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$retrieveCitation',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $name: name,
                    $text: bali.text('An unexpected error occurred while attempting to retrieve a named citation.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method creates a new draft document template based on the specified document
         * type name.
         * 
         * @param {Name} type The name of the type of document to be created.
         * @returns {Catalog} A document template for the new draft document.
         */
        createDraft: async function(type) {
            try {
                validateParameter('$createDraft', 'type', type, 'type', debug);
                var citation = cache.fetchCitation(type);
                if (!citation) {
                    const source = await repository.fetchCitation(type);
                    if (source) {
                        citation = bali.parse(source);
                        cache.createCitation(type, citation);
                    }
                }
                const draft = constructTemplate(citation, debug);
                return draft;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$createDraft',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to create a new draft document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method saves in the Bali Nebula™ a draft document.
         * 
         * @param {Component} draft The draft document to be saved.
         * @returns {Catalog} A document citation for the draft document.
         */
        saveDraft: async function(draft) {
            try {
                validateParameter('$saveDraft', 'draft', draft, 'draft', debug);
                draft = await notary.signComponent(draft);
                const draftCitation = await notary.citeDocument(draft);
                const draftId = extractId(draftCitation);
                if (cache.documentExists(draftId) || await repository.documentExists(draftId)) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$saveDraft',
                        $exception: '$versionExists',
                        $tag: draftCitation.getValue('$tag'),
                        $version: draftCitation.getValue('$version'),
                        $text: bali.text('A committed version of the document referenced by the citation already exists.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                await repository.saveDraft(draftId, draft);
                // we don't cache drafts since they are mutable
                return draftCitation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$saveDraft',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to update a draft document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method retrieves from the Bali Nebula™ the saved draft document
         * associated with the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired draft document.
         * @returns {Component} The desired draft document.
         */
        retrieveDraft: async function(citation) {
            try {
                validateParameter('$retrieveDraft', 'citation', citation, 'citation', debug);
                const documentId = extractId(citation);
                var draft;
                const source = await repository.fetchDraft(documentId);
                if (source) {
                    const document = bali.parse(source);
                    await validateCitation(notary, citation, document);
                    await validateDocument(notary, repository, document);
                    // we don't cache drafts since they are mutable
                    draft = document.getValue('$component');
                }
                return draft;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$retrieveDraft',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to retrieve a draft document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method deletes from the Bali Nebula™ the saved draft document
         * associated with the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the draft document to be deleted.
         */
        discardDraft: async function(citation) {
            try {
                validateParameter('$discardDraft', 'citation', citation, 'citation', debug);
                const documentId = extractId(citation);
                await repository.deleteDraft(documentId);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$discardDraft',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to discard a draft document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method commits to the Bali Nebula™ the specified draft document
         * to be associated with the specified document citation.
         * 
         * @param {Component} draft The draft document to be committed.
         * @returns {Catalog} The updated citation for the committed document.
         */
        commitDocument: async function(draft) {
            try {
                validateParameter('$commitDocument', 'draft', draft, 'draft', debug);
                var document = await notary.signComponent(draft);
                const documentCitation = await notary.citeDocument(document);
                const documentId = extractId(documentCitation);
                if (cache.documentExists(documentId) || await repository.documentExists(documentId)) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$commitDocument',
                        $exception: '$versionExists',
                        $documentId: bali.text(documentId),
                        $text: bali.text('A committed version of the document referenced by the citation already exists.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                await repository.createDocument(documentId, document);
                document = document.getValue('$component');
                cache.createDocument(documentId, document);
                await repository.deleteDraft(documentId);
                return documentCitation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$commitDocument',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to commit a draft document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method retrieves from the Bali Nebula™ the committed document
         * for the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired document.
         * @returns {Component} The desired document.
         */
        retrieveDocument: async function(citation) {
            try {
                validateParameter('$retrieveDocument', 'citation', citation, 'citation', debug);
                const documentId = extractId(citation);
                var document = cache.fetchDocument(documentId);
                if (!document) {
                    const source = await repository.fetchDocument(documentId);
                    if (source) {
                        document = bali.parse(source);
                        await validateCitation(notary, citation, document);
                        await validateDocument(notary, repository, document);
                        document = document.getValue('$component');
                        cache.createDocument(documentId, document);
                    }
                }
                return document;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$retrieveDocument',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to retrieve a document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method checks out from the Bali Nebula™ a new draft of the
         * committed document for the specified document citation. The version string
         * for the new draft is calculated based on the specified level.
         * <pre>
         *      level     current            draft
         *     level 1:    v5.7              v6         (interface/symantic changes)
         *     level 2:    v5.7              v5.8       (optimization/bug fixes)
         *     level 2:    v5.7              v5.7.1     (changes being tested)
         * </pre>
         * 
         * @param {Catalog} citation The document citation for the committed document.
         * @param {Number} level The (optional) version level that should be incremented. If no
         * level is specified, the last number in the document version string is incremented.
         * @returns {Catalog} The document citation for the new draft document.
         */
        checkoutDocument: async function(citation, level) {
            try {
                // validate the parameters
                validateParameter('$checkoutDocument', 'citation', citation, 'citation', debug);
                validateParameter('$checkoutDocument', 'level', level, 'level', debug);

                // create the draft citation
                const documentVersion = citation.getValue('$version');
                const draftVersion = bali.version.nextVersion(documentVersion, level);

                // make sure that there is no document already referenced by the draft citation
                const draftId = citation.getValue('$tag').getValue() + draftVersion;
                if (cache.documentExists(draftId) || await repository.documentExists(draftId) || await repository.draftExists(draftId)) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$checkoutDocument',
                        $exception: '$versionExists',
                        $documentId: bali.text(draftId),
                        $text: bali.text('A committed version of the document referenced by the citation already exists.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }

                // retrieve the document to be checked out
                const documentId = extractId(citation);
                const source = await repository.fetchDocument(documentId);
                if (source === undefined) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$checkoutDocument',
                        $exception: '$documentMissing',
                        $documentId: bali.text(documentId),
                        $text: bali.text('The document referenced by the citation does not exist.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                var document = bali.parse(source);

                // validate and cache the document
                await validateCitation(notary, citation, document);
                await validateDocument(notary, repository, document);
                document = document.getValue('$component');
                cache.createDocument(documentId, document);

                // store a draft copy of the document in the repository (NOTE: drafts are not cached)
                var draft = bali.duplicate(document);
                draft.getParameters().setParameter('$version', draftVersion);
                draft = await notary.signComponent(draft, citation);
                const draftCitation = await notary.citeDocument(draft);
                await repository.saveDraft(draftId, draft);

                return draftCitation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$checkoutDocument',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to checkout a document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method compiles the document type associated with the specified document
         * citation in the Bali Nebula™.
         * 
         * @param {Catalog} draft The draft document for the type to be compiled.
         * @returns {Catalog} A Bali document citation to the newly compiled type document.
         */
        compileType: async function(draft) {
            try {
                validateParameter('$compileType', 'draft', draft, 'draft', debug);
                const parameters = draft.getParameters();
        
                // extract any literals, constants and procedures from the parent type
                const literals = bali.list();
                const constants = bali.catalog();
                var procedures = bali.catalog();
                const parentTypeCitation = draft.getValue('$parent');
                if (parentTypeCitation && parentTypeCitation.getTypeId() === bali.types.CATALOG) {
                    const parentType = await this.retrieveDocument(parentTypeCitation);
                    const compiledParentCitation = parentType.getValue('$compiled');
                    if (compiledParentCitation && compiledParentCitation.getTypeId() === bali.types.CATALOG) {
                        const compiledParent = await this.retrieveDocument(compiledParentCitation);
                        literals.addItems(compiledParent.getValue('$literals'));
                        constants.addItems(compiledParent.getValue('$constants'));
                        procedures.addItems(compiledParent.getValue('$procedures'));
                    }
                }
        
                // add in the constants from the child draft type
                const items = draft.getValue('$constants');
                if (items) constants.addItems(items);
                var compiledCitation = draft.getValue('$compiled');
        
                // create the compilation type context
                const type = bali.catalog([], bali.parameters({
                    $tag: compiledCitation ? compiledCitation.getValue('$tag') : bali.tag(),
                    $version: parameters.getValue('$version'),
                    $permissions: parameters.getValue('$permissions'),
                    $previous: compiledCitation || bali.pattern.NONE
                }));
                type.setValue('$literals', literals);
                type.setValue('$constants', constants);
                type.setValue('$procedures', procedures);
        
                // compile each procedure defined in the type definition document
                var association, name, procedure;
                procedures = draft.getValue('$procedures');
                if (procedures) {
                    // iterate through procedure definitions
                    var iterator = procedures.getIterator();
                    procedures = bali.catalog();  // for compiled procedures
                    while (iterator.hasNext()) {
        
                        // retrieve the source code for the procedure
                        association = iterator.getNext();
                        name = association.getKey();
                        const source = association.getValue().getValue('$source');
        
                        // compile the source code
                        procedure = compiler.compile(type, source, debug);
                        procedures.setValue(name, procedure);  // compiled procedure
                    }
        
                    // iterate through the compiled procedures
                    iterator = procedures.getIterator();
                    while (iterator.hasNext()) {
        
                        // retrieve the compiled procedure
                        association = iterator.getNext();
                        name = association.getKey();
                        procedure = association.getValue();
        
                        // assemble the instructions in the procedure into bytecode
                        compiler.assemble(type, procedure, debug);
        
                        // add the assembled procedure to the type context
                        type.getValue('$procedures').setValue(name, procedure);
                    }
                }
        
                // checkin the draft and newly compiled type
                // TODO: replace this logic with calls to notaryDocument and then make remote call
                //       compile the type and verify that the result is identical before posting.
                compiledCitation = await this.commitDocument(type);
                draft.setValue('$compiled', compiledCitation);
                const typeCitation = await this.commitDocument(draft);
        
                return typeCitation;
        
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$compileType',
                    $exception: '$unexpected',
                    $draft: draft,
                    $text: bali.text('An unexpected error occurred while attempting to compile a draft type.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method publishes the specified event in the Bali Nebula™.
         * Any component that has registered event handlers for this type of event
         * will be automatically notified.
         * 
         * @param {Catalog} event The Bali catalog documenting the event.
         */
        publishEvent: async function(event) {
            try {
                validateParameter('$publishEvent', 'event', event, 'draft', debug);
                event = await notary.signComponent(event);
                await repository.queueMessage(EVENT_QUEUE_ID, event);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$publishEvent',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to publish an event.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method sends the specified message to the document residing in the Bali
         * Nebula™ that is referenced by the specified target document citation.
         * The message is sent asynchronously so there is no response.
         * 
         * @param {Catalog} target A document citation referencing the document containing
         * the target component of the message.
         * @param {Catalog} message The message to be sent to the target component.
         */
        sendMessage: async function(target, message) {
            try {
                validateParameter('$sendMessage', 'target', target, 'citation', debug);
                validateParameter('$sendMessage', 'message', message, 'draft', debug);
                message.setValue('$target', target);
                message = await notary.signComponent(message);
                await repository.queueMessage(SEND_QUEUE_ID, message);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$sendMessage',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to send a message.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method places the specified message on the specified queue in the Bali
         * Nebula™. The message will be received by another task using the
         * <code>receiveMessage(queue)</code> method with the same queue from the API.
         * 
         * @param {Tag} queue The unique tag identifying the queue on which to place
         * the message.
         * @param {Catalog} message The message to be placed on the queue.
         */
        queueMessage: async function(queue, message) {
            try {
                validateParameter('$queueMessage', 'queue', queue, 'tag', debug);
                validateParameter('$queueMessage', 'message', message, 'draft', debug);
                message = await notary.signComponent(message);
                const queueId = queue.getValue();
                await repository.queueMessage(queueId, message);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$queueMessage',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to queue a message.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method receives a message from the specified queue in the Bali
         * Nebula™. The message was placed there by another task using the
         * <code>queueMessage(queue, message)</code> method with the same queue from the API.
         * If there are no messages on the queue, the result of this call will be 'none'.
         * 
         * @param {Tag} queue The unique tag identifying the queue from which to receive
         * the message.
         * @returns {Component} The message received from the queue.
         */
        receiveMessage: async function(queue) {
            try {
                validateParameter('$receiveMessage', 'queue', queue, 'tag', debug);
                const queueId = queue.getValue();
                var message;
                const source = await repository.dequeueMessage(queueId);
                if (source) {
                    // validate the document
                    const document = bali.parse(source);
                    await validateDocument(notary, repository, document);
                    message = document.getValue('$component');
                }
                return message;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$receiveMessage',
                    $exception: '$unexpected',
                    $accountTag: notary.getAccountTag(),
                    $text: bali.text('An unexpected error occurred while attempting to receive a message.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        }
    };
};


// PRIVATE FUNCTIONS

/**
 * This function extracts the '$tag' and '$version' attributes from the specified catalog
 * and uses them to form a unique identification string.
 * 
 * @param {Catalog} catalog A catalog component.
 * @returns {String} A unique identification string for the component.
 */
const extractId = function(catalog) {
    const id = catalog.getValue('$tag').getValue() + catalog.getValue('$version');
    return id;
};


/**
 * This function validates the specified document citation against a document to make sure
 * that the citation digest was generated from the same document.  If not, an exception is
 * thrown.
 * 
 * @param {Object} notary The notary to be used when validating the document citation.
 * @param {Catalog} citation The document citation to be validated.
 * @param {Component} document The document that supposedly was used to generate the
 * document citation.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @throws {Exception} The digest generated for the document does not match the digest
 * contained within the document citation.
 */
const validateCitation = async function(notary, citation, document, debug) {
    debug = debug || false;
    try {
        const matches = await notary.citationMatches(citation, document);
        if (!matches) {
            const exception = bali.exception({
                $module: '/bali/services/NebulaAPI',
                $procedure: '$validateCitation',
                $exception: '$documentModified',
                $citation: citation,
                $document: document,
                $text: bali.text('The cited document was modified after it was committed.')
            });
            if (debug) console.error(exception.toString());
            throw exception;
        }
    } catch (cause) {
        const exception = bali.exception({
            $module: '/bali/services/NebulaAPI',
            $procedure: '$validateCitation',
            $exception: '$unexpected',
            $citation: citation,
            $document: document,
            $text: bali.text('An unexpected error occurred while attempting to validate a citation.')
        }, cause);
        if (debug) console.error(exception.toString());
        throw exception;
    }
};


/**
 * This function validates a notarized document. It makes sure that all notary seals
 * attached to the document are valid. If any seal is not valid an exception is thrown.
 * 
 * @param {Object} notary The notary to be used for validating the document.
 * @param {Object} repository The document repository containing the certificates.
 * @param {Catalog} document The notarized document to be validated.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @throws {Exception} The document is not valid.
 */
const validateDocument = async function(notary, repository, document, debug) {
    debug = debug || false;
    try {
        var certificateCitation = document.getValue('$certificate');
        while (certificateCitation && !certificateCitation.isEqualTo(bali.pattern.NONE) && !certificateCitation.getValue('$digest').isEqualTo(bali.pattern.NONE)) {

            // validate the document citation to the previous version of the document
            const previousCitation = document.getValue('$previous');
            if (previousCitation && !previousCitation.isEqualTo(bali.pattern.NONE)) {
                const previousId = extractId(previousCitation);
                source = await repository.fetchDocument(previousId);
                if (!source) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$validateDocument',
                        $exception: '$documentMissing',
                        $previousId: bali.text(previousId),
                        $text: bali.text('The previous version of the document does not exist.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                const previousDocument = bali.parse(source);
                if (!(await notary.citationMatches(previousCitation, previousDocument))) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$validateDocument',
                        $exception: '$invalidCitation',
                        $citation: previousCitation,
                        $text: bali.text('The digest in the previous document citation does not match the previous document.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                // don't cache the previous version since it has not been validated!
            }

            // check for a self notarized document
            var certificate;
            if (certificateCitation.isEqualTo(bali.pattern.NONE)) {
                certificate = document.getValue('$component');
                if (await notary.documentIsValid(document, certificate)) return;
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$validateDocument',
                    $exception: '$documentInvalid',
                    $document: document,
                    $text: bali.text('The self notarized document is invalid.')
                });
                if (debug) console.error(exception.toString());
                throw exception;
            }

            // fetch and validate if necessary the certificate
            const certificateId = extractId(certificateCitation);
            certificate = cache.fetchDocument(certificateId);
            if (!certificate) {
                const source = await repository.fetchDocument(certificateId);
                if (!source) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$validateDocument',
                        $exception: '$certificateMissing',
                        $certificateId: bali.text(certificateId),
                        $text: bali.text('The certificate for the document does not exist.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                const document = bali.parse(source);
                await validateCitation(notary, certificateCitation, document);
                await validateDocument(notary, repository, document);
                certificate = document.getValue('$component');
                cache.createDocument(certificateId, certificate);
            }

            // validate the document
            const valid = await notary.documentIsValid(document, certificate);
            if (!valid) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$validateDocument',
                    $exception: '$documentInvalid',
                    $document: document,
                    $text: bali.text('The signature on the document is invalid.')
                });
                if (debug) console.error(exception.toString());
                throw exception;
            }

            // validate any nested documents
            try {
                document = document.getValue('$component');
                certificateCitation = document.getValue('$certificate');
            } catch (e) {
                // we have validated the inner most document so we are done
                break;
            }
        }
    } catch (cause) {
        const exception = bali.exception({
            $module: '/bali/services/NebulaAPI',
            $procedure: '$validateDocument',
            $exception: '$unexpected',
            $document: document,
            $text: bali.text('An unexpected error occurred while attempting to validate a document.')
        }, cause);
        if (debug) console.error(exception.toString());
        throw exception;
    }
};


/**
 * This function determines whether or not the specified parameter is valid.
 * 
 * @param {String} procedureName The name of the procedure being passed the parameter. 
 * @param {String} parameterName The name of the parameter being passed.
 * @param {Object} parameterValue The value of the parameter being passed.
 * @param {String} parameterType The expected type of the parameter being passed.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @throws {Exception} The parameter is not valid.
 */
const validateParameter = function(procedureName, parameterName, parameterValue, parameterType, debug) {
    debug = debug || false;
    if (parameterValue) {
        switch (parameterType) {
            case 'binary':
            case 'moment':
            case 'name':
            case 'tag':
            case 'version':
                // Primitive types must have a typeId and their type must match the passed in type
                if (parameterValue && parameterValue.getTypeId) {
                    if (parameterValue.getTypeId() === bali.types[parameterType.toUpperCase()]) {
                        return;
                    }
                }
                break;
            case 'directory':
                // A directory must be a string that matches a specific pattern
                const pattern = new RegExp('/?(\\w+/)+');
                if (typeof parameterValue === 'string' && pattern.test(parameterValue)) return;
                break;
            case 'component':
                // A component must just have a typeId
                if (parameterValue.getTypeId) return;
                break;
            case 'citation':
                // A certificate must have the following:
                //  * a parameterized type of /bali/types/Citation/v...
                //  * exactly five specific attributes
                if (parameterValue.getTypeId && parameterValue.isEqualTo(bali.pattern.NONE)) return;
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 5) {
                    validateParameter(procedureName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version', debug);
                    validateParameter(procedureName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment', debug);
                    validateParameter(procedureName, parameterName + '.tag', parameterValue.getValue('$tag'), 'tag', debug);
                    validateParameter(procedureName, parameterName + '.version', parameterValue.getValue('$version'), 'version', debug);
                    validateParameter(procedureName, parameterName + '.digest', parameterValue.getValue('$digest'), 'binary', debug);
                    const parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() === 1) {
                        validateParameter(procedureName, parameterName + '.parameters.type', parameters.getValue('$type'), 'name', debug);
                        if (parameters.getValue('$type').toString().startsWith('/bali/notary/Citation/v')) return;
                    }
                }
                break;
            case 'certificate':
                // A certificate must have the following:
                //  * a parameterized type of /bali/types/Certificate/v...
                //  * exactly four specific attributes
                //  * and be parameterized with exactly 5 specific parameters
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 4) {
                    validateParameter(procedureName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version', debug);
                    validateParameter(procedureName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment', debug);
                    validateParameter(procedureName, parameterName + '.account', parameterValue.getValue('$account'), 'tag', debug);
                    validateParameter(procedureName, parameterName + '.publicKey', parameterValue.getValue('$publicKey'), 'binary', debug);
                    const parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() > 4) {
                        validateParameter(procedureName, parameterName + '.parameters.type', parameters.getValue('$type'), 'name', debug);
                        validateParameter(procedureName, parameterName + '.parameters.tag', parameters.getValue('$tag'), 'tag', debug);
                        validateParameter(procedureName, parameterName + '.parameters.version', parameters.getValue('$version'), 'version', debug);
                        validateParameter(procedureName, parameterName + '.parameters.permissions', parameters.getValue('$permissions'), 'name', debug);
                        validateParameter(procedureName, parameterName + '.parameters.previous', parameters.getValue('$previous'), 'citation', debug);
                        if (parameters.getValue('$type').toString().startsWith('/bali/types/Certificate/v') &&
                            parameters.getValue('$permissions').toString().startsWith('/bali/permissions/public/v')) return;
                    }
                }
                break;
            case 'draft':
                // A draft must have the following:
                //  * be parameterized with at least four parameters
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG) {
                    var parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() > 3) {
                        validateParameter(procedureName, parameterName + '.parameters.tag', parameters.getValue('$tag'), 'tag', debug);
                        validateParameter(procedureName, parameterName + '.parameters.version', parameters.getValue('$version'), 'version', debug);
                        validateParameter(procedureName, parameterName + '.parameters.permissions', parameters.getValue('$permissions'), 'name', debug);
                        validateParameter(procedureName, parameterName + '.parameters.previous', parameters.getValue('$previous'), 'citation', debug);
                    } return;
                }
                break;
            case 'document':
                // A document must have the following:
                //  * a parameterized type of /bali/types/Document/v...
                //  * exactly five specific attributes including a $component attribute
                //  * the $component attribute must be parameterized with at least four parameters
                //  * the $component attribute may have a parameterized type as well
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 5) {
                    validateParameter(procedureName, parameterName + '.component', parameterValue.getValue('$component'), 'component', debug);
                    validateParameter(procedureName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version', debug);
                    validateParameter(procedureName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment', debug);
                    validateParameter(procedureName, parameterName + '.certificate', parameterValue.getValue('$certificate'), 'citation', debug);
                    validateParameter(procedureName, parameterName + '.signature', parameterValue.getValue('$signature'), 'binary', debug);
                    var parameters = parameterValue.getValue('$component').getParameters();
                    if (parameters) {
                        if (parameters.getValue('$type')) validateParameter(procedureName, parameterName + '.parameters.type', parameters.getValue('$type'), 'name', debug);
                        validateParameter(procedureName, parameterName + '.parameters.tag', parameters.getValue('$tag'), 'tag', debug);
                        validateParameter(procedureName, parameterName + '.parameters.version', parameters.getValue('$version'), 'version', debug);
                        validateParameter(procedureName, parameterName + '.parameters.permissions', parameters.getValue('$permissions'), 'name', debug);
                        validateParameter(procedureName, parameterName + '.parameters.previous', parameters.getValue('$previous'), 'citation', debug);
                        parameters = parameterValue.getParameters();
                        if (parameters && parameters.getSize() === 1) {
                            if (parameters.getValue('$type').toString().startsWith('/bali/types/Document/v')) return;
                        }
                    }
                }
                break;
        }
    }
    if (parameterType === 'level') {
        if (typeof parameterValue === 'undefined') return;
        if (typeof parameterValue === 'number' && parameterValue > 0) return;
    }
    const exception = bali.exception({
        $module: '/bali/services/NebulaAPI',
        $procedure: procedureName,
        $exception: '$invalidParameter',
        $parameter: bali.symbol(parameterName),
        $value: parameterValue ? bali.text(EOF + parameterValue.toString() + EOF) : bali.pattern.NONE,
        $text: bali.text('An invalid parameter value was passed to the function.')
    });
    if (debug) console.error(exception.toString());
    throw exception;
};


/**
 * This function constructs a template of a component of the specified type.
 * 
 * @param {Catalog} type A catalog containing a type definition. 
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Catalog} The newly constructed component template.
 */
const constructTemplate = function(type, debug) {
    debug = debug || false;
    try {
        const template = bali.catalog({}, bali.parameters({
            $type: type,
            $tag: bali.tag(),  // a new unique tag
            $version: bali.version(),  // initial version
            $permissions: '/bali/permissions/private/v1',
            $previous: bali.pattern.NONE
        }));
        const attributes = type.getValue('$attributes');
        if (attributes && attributes.getIterator) {
            const iterator = attributes.getIterator();
            while (iterator.hasNext()) {
                var attribute = iterator.getNext();
                var symbol = attribute.getKey();
                var definition = attribute.getValue();
                var value = definition.getValue('$default');
                if (!value) value = constructTemplate(definition.getValue('$type'));
                template.setValue(symbol, value);
            }
        }
        return template;
    } catch (cause) {
        const exception = bali.exception({
            $module: '/bali/services/NebulaAPI',
            $procedure: '$constructTemplate',
            $exception: '$unexpected',
            $type: type,
            $text: bali.text('An unexpected error occurred while attempting to construct a template from a type.')
        }, cause);
        if (debug) console.error(exception.toString());
        throw exception;
    }
};


/*
 * This section defines the caches for the client side API.
 * Since all citations and documents are immutable, there are no cache consistency issues.
 * The caching rules are as follows:
 * <pre>
 * 1) The cache is always checked before downloading a citation or document.
 * 2) A downloaded citation or document is always validated before use.
 * 3) A validated citation or document is always cached locally.
 * 4) The cache will delete the oldest citation or document when it is full.
 * </pre>
 */
const cache = {

    MAXIMUM: 256,

    citations: new Map(),
    documents: new Map(),

    citationExists: function(name) {
        return this.citations.has(name);
    },

    fetchCitation: function(name) {
        return this.citations.get(name);
    },

    createCitation: function(name, citation) {
        if (this.citations.size > this.MAXIMUM) {
            // delete the first (oldest) cached citation
            const key = this.citations.keys().next().getValue();
            this.citations.delete(key);
        }
        this.citations.set(name, citation);
    },

    documentExists: function(documentId) {
        return this.documents.has(documentId);
    },

    fetchDocument: function(documentId) {
        return this.documents.get(documentId);
    },

    createDocument: function(documentId, document) {
        if (this.documents.size > this.MAXIMUM) {
            // delete the first (oldest) cached document
            const key = this.documents.keys().next().getValue();
            this.documents.delete(key);
        }
        this.documents.set(documentId, document);
    }

};
