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
                $accountId: this.getAccountId(),
                $url: this.getURL()
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
        getAccountId: function() {
            return notary.getAccountId();
        },

        /**
         * This function returns a reference to the document repository that is used by this
         * client.
         * 
         * @returns {Reference} A reference to the document repository that is used by this
         * client.
         */
        getURL: function() {
            return repository.getURL();
        },

        /**
         * This function registers a new account with the Bali Nebula™. A valid account is
         * required for general access to the Bali Nebula™.
         * 
         * @param {Catalog} account A notarized document containing the account information.
         * @param {Catalog} credentials A notarized document containing the notary certificate
         * for the new account.
         */
        registerAccount: async function(account, credentials) {
            try {
                validateParameter('$registerAccount', 'account', account, 'account', debug);
                validateParameter('$registerAccount', 'credentials', credentials, 'credentials', debug);
                const certificate = credentials.getValue('$component');
                if (!(await notary.documentIsValid(credentials, certificate))) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$registerAccount',
                        $exception: '$documentInvalid',
                        $document: credentials,
                        $certificate: certificate,
                        $text: '"The signed credentials document is invalid."'
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                if (!(await notary.documentIsValid(account, certificate))) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$registerAccount',
                        $exception: '$documentInvalid',
                        $document: account,
                        $certificate: certificate,
                        $text: '"The signed account document is invalid."'
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                const accountCitation = await notary.citeDocument(account);
                const accountId = notary.getAccountId();
                if (await repository.documentExists(accountId)) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$registerAccount',
                        $exception: '$versionExists',
                        $accountId: accountId,
                        $text: '"A committed version of the account already exists."'
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                const certificateCitation = await notary.citeDocument(credentials);
                const certificateId = extractId(certificateCitation);
                if (await repository.documentExists(certificateId)) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$registerAccount',
                        $exception: '$versionExists',
                        $tag: certificateCitation.getValue('$tag'),
                        $version: certificateCitation.getValue('$version'),
                        $text: '"A committed version of the certificate already exists."'
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                await repository.createDocument(accountId, account);
                await repository.createDocument(certificateId, credentials);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$registerAccount',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to register a new account.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
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
                        $text: '"The citation name already exists."'
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
                    $accountId: notary.getAccountId(),
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
                    $accountId: notary.getAccountId(),
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
                    $accountId: notary.getAccountId(),
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
                        $text: '"A committed version of the document referenced by the citation already exists."'
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
                    $accountId: notary.getAccountId(),
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
                    $accountId: notary.getAccountId(),
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
                    $accountId: notary.getAccountId(),
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
         * @param {Component} document The draft document to be committed.
         * @returns {Catalog} The updated citation for the committed document.
         */
        commitDocument: async function(document) {
            try {
                validateParameter('$commitDocument', 'document', document, 'document', debug);
                document = await notary.signComponent(document);
                const documentCitation = await notary.citeDocument(document);
                const documentId = extractId(documentCitation);
                if (cache.documentExists(documentId) || await repository.documentExists(documentId)) {
                    const exception = bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$commitDocument',
                        $exception: '$versionExists',
                        $documentId: '"' + documentId + '"',
                        $text: '"A committed version of the document referenced by the citation already exists."'
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
                    $accountId: notary.getAccountId(),
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
                    $accountId: notary.getAccountId(),
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
                        $documentId: '"' + draftId + '"',
                        $text: '"A committed version of the document referenced by the citation already exists."'
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
                        $documentId: '"' + documentId + '"',
                        $text: '"The document referenced by the citation does not exist."'
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
                    $accountId: notary.getAccountId(),
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
         * @param {Catalog} citation The document citation for the type to be compiled.
         */
        compileType: async function(citation) {
            try {
                validateParameter('$compileType', 'citation', citation, 'citation', debug);
                await compileType(this, citation, debug);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$compileType',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to commit the compiled type.')
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
                validateParameter('$publishEvent', 'event', event, 'event', debug);
                event = await notary.signComponent(event);
                await repository.queueMessage(EVENT_QUEUE_ID, event);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$publishEvent',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
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
                validateParameter('$sendMessage', 'target', target, 'target', debug);
                validateParameter('$sendMessage', 'message', message, 'message', debug);
                message.setValue('$target', target);
                message = await notary.signComponent(message);
                await repository.queueMessage(SEND_QUEUE_ID, message);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$sendMessage',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
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
                validateParameter('$queueMessage', 'queue', queue, 'queue', debug);
                validateParameter('$queueMessage', 'message', message, 'message', debug);
                message = await notary.signComponent(message);
                const queueId = queue.getValue();
                await repository.queueMessage(queueId, message);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$queueMessage',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
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
                validateParameter('$receiveMessage', 'queue', queue, 'queue', debug);
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
                    $accountId: notary.getAccountId(),
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
                $text: '"The cited document was modified after it was committed."'
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
                        $previousId: '"' + previousId + '"',
                        $text: '"The previous version of the document does not exist."'
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
                        $text: '"The digest in the previous document citation does not match the previous document."'
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                }
                // don't cache the previous version since it has not been validated!
            }

            // check for a self signed document
            var certificate;
            if (certificateCitation.isEqualTo(bali.pattern.NONE)) {
                certificate = document.getValue('$component');
                if (await notary.documentIsValid(document, certificate)) return;
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$validateDocument',
                    $exception: '$documentInvalid',
                    $document: document,
                    $text: '"The self signed document is invalid."'
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
                        $certificateId: '"' + certificateId + '"',
                        $text: '"The certificate for the document does not exist."'
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
                    $text: '"The signature on the document is invalid."'
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
 * @param {String} type The expected type of the parameter being passed.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @throws {Exception} The parameter is not valid.
 */
const validateParameter = function(procedureName, parameterName, parameterValue, type, debug) {
    debug = debug || false;
    /*
    if (parameterValue) {
        switch (type) {
            case 'binary':
            case 'moment':
            case 'name':
            case 'tag':
            case 'version':
                // Primitive types must have a typeId and their type must match the passed in type
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types[type.toUpperCase()]) return;
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
                    validateParameter(procedureName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version');
                    validateParameter(procedureName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment');
                    validateParameter(procedureName, parameterName + '.tag', parameterValue.getValue('$tag'), 'tag');
                    validateParameter(procedureName, parameterName + '.version', parameterValue.getValue('$version'), 'version');
                    validateParameter(procedureName, parameterName + '.digest', parameterValue.getValue('$digest'), 'binary');
                    const parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() === 1) {
                        validateParameter(procedureName, parameterName + '.parameters.type', parameters.getParameter('$Type'), 'name');
                        if (parameters.getParameter('$Type').toString().startsWith('/bali/types/Citation/v')) return;
                    }
                }
                break;
            case 'certificate':
                // A certificate must have the following:
                //  * a parameterized type of /bali/types/Certificate/v...
                //  * exactly four specific attributes
                //  * and be parameterized with exactly 5 specific parameters
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 4) {
                    validateParameter(procedureName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version');
                    validateParameter(procedureName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment');
                    validateParameter(procedureName, parameterName + '.account', parameterValue.getValue('$account'), 'tag');
                    validateParameter(procedureName, parameterName + '.publicKey', parameterValue.getValue('$publicKey'), 'binary');
                    const parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() === 5) {
                        validateParameter(procedureName, parameterName + '.parameters.type', parameters.getParameter('$Type'), 'name');
                        validateParameter(procedureName, parameterName + '.parameters.tag', parameters.getParameter('$tag'), 'tag');
                        validateParameter(procedureName, parameterName + '.parameters.version', parameters.getParameter('$version'), 'version');
                        validateParameter(procedureName, parameterName + '.parameters.permissions', parameters.getParameter('$permissions'), 'name');
                        validateParameter(procedureName, parameterName + '.parameters.previous', parameters.getParameter('$previous'), 'citation');
                        if (parameters.getParameter('$Type').toString().startsWith('/bali/types/Certificate/v') &&
                            parameters.getParameter('$permissions').toString().startsWith('/bali/permissions/public/v')) return;
                    }
                }
                break;
            case 'document':
                // A document must have the following:
                //  * a parameterized type of /bali/types/Document/v...
                //  * exactly five specific attributes including a $component attribute
                //  * the $component attribute must be parameterized with at least four parameters
                //  * the $component attribute may have a parameterized type as well
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 5) {
                    validateParameter(procedureName, parameterName + '.component', parameterValue.getValue('$component'), 'component');
                    validateParameter(procedureName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version');
                    validateParameter(procedureName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment');
                    validateParameter(procedureName, parameterName + '.certificate', parameterValue.getValue('$certificate'), 'citation');
                    validateParameter(procedureName, parameterName + '.signature', parameterValue.getValue('$signature'), 'binary');
                    var parameters = parameterValue.getValue('$component').getParameters();
                    if (parameters) {
                        if (parameters.getParameter('$Type')) validateParameter(procedureName, parameterName + '.parameters.type', parameters.getParameter('$Type'), 'name');
                        validateParameter(procedureName, parameterName + '.parameters.tag', parameters.getParameter('$tag'), 'tag');
                        validateParameter(procedureName, parameterName + '.parameters.version', parameters.getParameter('$version'), 'version');
                        validateParameter(procedureName, parameterName + '.parameters.permissions', parameters.getParameter('$permissions'), 'name');
                        validateParameter(procedureName, parameterName + '.parameters.previous', parameters.getParameter('$previous'), 'citation');
                        parameters = parameterValue.getParameters();
                        if (parameters && parameters.getSize() === 1) {
                            if (parameters.getParameter('$Type').toString().startsWith('/bali/types/Document/v')) return;
                        }
                    }
                }
                break;
        }
    }
    const exception = bali.exception({
        $module: '/bali/services/NebulaAPI',
        $procedure: procedureName,
        $exception: '$invalidParameter',
        $parameter: bali.text(parameterName),
        $value: parameterValue ? bali.text(parameterValue.toString()) : bali.pattern.NONE,
        $text: bali.text('An invalid parameter value was passed to the function.')
    });
    if (debug) console.error(exception.toString());
    throw exception;
    */
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


// COMPILE FUNCTION
/**
 * This function compiles a type definition residing in the Bali Nebula™ and returns
 * a document citation to the newly compiled type.  The type definition must be a
 * committed document in the Bali Nebula™.
 * 
 * @param {Object} nebula A JavaScript object that implements the Bali Nebula™ API.
 * @param {Catalog} citation A Bali document citation to the type definition.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Catalog} A Bali document citation to the newly compiled type.
 */
const compileType = async function(nebula, citation, debug) {
    try {
        const compiler = new exports.Compiler();
        const assembler = new exports.Assembler();

        // retrieve the type document
        const document = await nebula.retrieveDocument(citation);
        const parameters = document.getParameters();

        // extract the literals, constants and procedures for the parent type
        const literals = bali.list();
        const constants = bali.catalog();
        var procedures = bali.catalog();
        citation = document.getValue('$parent');
        if (citation) {
            // TODO: This is a citation to the parent type definition document, not the compiled
            //       type so its digest will not match the parent type.  How do we address this in
            //       a way that preserves the merkle pointer chain?
            citation.setValue('$digest', bali.pattern.NONE);

            // retrieve the compiled parent type
            const parent = await nebula.retrieveDocument(citation);
            literals.addItems(parent.getValue('$literals'));
            constants.addItems(parent.getValue('$constants'));
            procedures.addItems(parent.getValue('$procedures'));
        }

        // add in the constants from the child type document
        const items = document.getValue('$constants');
        if (items) constants.addItems(items);

        // create the compilation type context
        const type = bali.catalog([], bali.parameters({
            $type: parameters.getParameter('$type'),
            $name: parameters.getParameter('$name'),
            $tag: parameters.getParameter('$tag'),
            $version: parameters.getParameter('$version'),
            $permissions: parameters.getParameter('$permissions'),
            $previous: parameters.getParameter('$previous')
        }));
        type.setValue('$literals', literals);
        type.setValue('$constants', constants);
        type.setValue('$procedures', procedures);

        // compile each procedure defined in the type definition document
        var association, name, procedure;
        procedures = document.getValue('$procedures');
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
                procedure = compiler.compileProcedure(type, source);
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
                assembler.assembleProcedure(type, procedure);

                // add the assembled procedure to the type context
                type.getValue('$procedures').setValue(name, procedure);
            }
        }

        // checkin the newly compiled type
        citation = await nebula.commitDocument(type);

        return citation;

    } catch (cause) {
        const exception = bali.exception({
            $module: '/bali/vm/Compiler',
            $procedure: '$compile',
            $exception: '$unexpected',
            $citation: citation,
            $text: bali.text('An unexpected error occurred while attempting to compile a document.')
        }, cause);
        if (debug) console.error(exception.toString());
        throw exception;
    }
};
