/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/


/*
 * This module uses the singleton pattern to provide an object that implements the API
 * used to by registered accounts to access the Bali Nebula™. The implementation
 * requires that objects implementing the digital notary API and the document repository API
 * be passed into the constructor.
 */

/*
 * This library provides useful functions for accessing the Bali Environment™.
 */
const bali = require('bali-component-framework');


/**
 * This function returns an object that implements the API for the Bali Nebula™.
 *
 * @param {Object} notary An object that implements the API for the digital notary. This API
 * should not yet be initialized.
 * @param {Object} repository An object that implements the API for the document repository.
 * This API should not yet be initialized.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} An object that implements the API for the Bali Nebula™.
 */
exports.api = function(notary, repository, debug) {
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
                $module: '$NebulaAPI',
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
         * This method retrieves from the Bali Nebula™ the certificate citation
         * for the digital notary for this client.
         * 
         * @returns {Catalog} The certificate citation for the digital notary for this client.
         */
        getCitation: async function() {
            try {
                const citation = await notary.getCitation();
                return citation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$getCitation',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to retrieve the notary certificate citation.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        registerAccount: async function(account, certificate) {
            try {
                validateParameter('$registerAccount', 'account', account);
                validateParameter('$registerAccount', 'certificate', certificate);
                const accountCitation = await notary.citeDocument(account);
                const accountId = notary.getAccountId();
                if (await repository.accountExists(accountId)) {
                    throw bali.exception({
                        $module: '$NebulaAPI',
                        $function: '$registerAccount',
                        $exception: '$versionExists',
                        $accountId: accountId,
                        $text: '"A committed version of the account already exists."'
                    });
                }
                const certificateCitation = await notary.citeDocument(certificate);
                const certificateId = extractId(certificateCitation);
                if (await repository.certificateExists(certificateId)) {
                    throw bali.exception({
                        $module: '$NebulaAPI',
                        $function: '$registerAccount',
                        $exception: '$versionExists',
                        $tag: certificateCitation.getValue('$tag'),
                        $version: certificateCitation.getValue('$version'),
                        $text: '"A committed version of the certificate already exists."'
                    });
                }
                await repository.createAccount(accountId, account);
                await repository.createCertificate(certificateId, certificate);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$registerAccount',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to register a new account.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method retrieves from the Bali Nebula™ the notary certificate
         * for the specified certificate citation.
         * 
         * @param {Catalog} citation The certificate citation for the desired notary certificate.
         * @returns {Catalog} The desired notary certificate.
         */
        retrieveCertificate: async function(citation) {
            try {
                validateParameter('$retrieveCertificate', 'citation', citation);
                const certificateId = extractId(citation);
                var certificate = cache.fetchCertificate(certificateId);
                if (!certificate) {
                    const source = await repository.fetchCertificate(certificateId);
                    if (source) {
                        const notarizedCertificate = bali.parse(source);
                        await validateCitation(notary, citation, notarizedCertificate);
                        await validateDocument(notary, repository, notarizedCertificate);
                        certificate = notarizedCertificate.getValue('$component');
                        cache.createCertificate(certificateId, certificate);
                    }
                }
                return certificate;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$retrieveCertificate',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to retrieve the notary certificate.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method retrieves from the Bali Nebula™ the compiled type document
         * for the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired compiled
         * type document.
         * @returns {Catalog} The compiled type document.
         */
        retrieveType: async function(citation) {
            try {
                validateParameter('$retrieveType', 'citation', citation);
                const typeId = extractId(citation);
                var type = cache.fetchType(typeId);
                if (!type) {
                    const source = await repository.fetchType(typeId);
                    if (source) {
                        const notarizedType = bali.parse(source);
                        await validateCitation(notary, citation, notarizedType);
                        await validateDocument(notary, repository, notarizedType);
                        type = notarizedType.getValue('$component');
                        cache.createType(typeId, type);
                    }
                }
                return type;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$retrieveType',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to retrieve the compiled type.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This method commits to the Bali Nebula™ the specified compiled type
         * document to be associated with the specified document citation. This method requires
         * the account calling it to have additional privileges.
         * 
         * @param {Catalog} type A catalog containing the compiled type to be committed.
         * @returns {Catalog} A document citation for the committed type document.
         */
        commitType: async function(type) {
            try {
                validateParameter('$commitType', 'type', type);
                const notarizedType = await notary.signComponent(type);
                const typeCitation = await notary.citeDocument(notarizedType);
                const typeId = extractId(typeCitation);
                if (await repository.typeExists(typeId)) {
                    throw bali.exception({
                        $module: '$NebulaAPI',
                        $function: '$commitType',
                        $exception: '$versionExists',
                        $tag: typeCitation.getValue('$tag'),
                        $version: typeCitation.getValue('$version'),
                        $text: '"A committed version of the type document referenced by the citation already exists."'
                    });
                }
                await repository.createType(typeId, notarizedType);
                type = notarizedType.getValue('$component');
                cache.createType(typeId, type);
                return typeCitation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$commitType',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to commit the compiled type.')
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
                validateParameter('$retrieveDraft', 'citation', citation);
                const documentId = extractId(citation);
                const source = await repository.fetchDraft(documentId);
                if (source) {
                    const notarizedDraft = bali.parse(source);
                    await validateCitation(notary, citation, notarizedDraft);
                    await validateDocument(notary, repository, notarizedDraft);
                    const draft = notarizedDraft.getValue('$component');
                    // we don't cache drafts since they are mutable
                    return draft;
                }
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$retrieveDraft',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to retrieve a draft document.')
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
                validateParameter('$saveDraft', 'draft', draft);
                const notarizedDraft = await notary.signComponent(draft);
                const draftCitation = await notary.citeDocument(notarizedDraft);
                const draftId = extractId(draftCitation);
                if (cache.documentExists(draftId) || await repository.documentExists(draftId)) {
                    throw bali.exception({
                        $module: '$NebulaAPI',
                        $function: '$saveDraft',
                        $exception: '$versionExists',
                        $tag: draftCitation.getValue('$tag'),
                        $version: draftCitation.getValue('$version'),
                        $text: '"A committed version of the document referenced by the citation already exists."'
                    });
                }
                await repository.saveDraft(draftId, notarizedDraft);
                // we don't cache drafts since they are mutable
                return draftCitation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$saveDraft',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to update a draft document.')
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
                validateParameter('$discardDraft', 'citation', citation);
                const documentId = extractId(citation);
                await repository.deleteDraft(documentId);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$discardDraft',
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
                validateParameter('$commitDocument', 'document', document);
                const notarizedDocument = await notary.signComponent(document);
                const documentCitation = await notary.citeDocument(notarizedDocument);
                const documentId = extractId(documentCitation);
                if (cache.documentExists(documentId) || await repository.documentExists(documentId)) {
                    throw bali.exception({
                        $module: '$NebulaAPI',
                        $function: '$commitDocument',
                        $exception: '$versionExists',
                        $documentId: '"' + documentId + '"',
                        $text: '"A committed version of the document referenced by the citation already exists."'
                    });
                }
                await repository.createDocument(documentId, notarizedDocument);
                document = notarizedDocument.getValue('$component');
                cache.createDocument(documentId, document);
                await repository.deleteDraft(documentId);
                return documentCitation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$commitDocument',
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
                validateParameter('$retrieveDocument', 'citation', citation);
                const documentId = extractId(citation);
                var document = cache.fetchDocument(documentId);
                if (!document) {
                    const source = await repository.fetchDocument(documentId);
                    if (source) {
                        const notarizedDocument = bali.parse(source);
                        await validateCitation(notary, citation, notarizedDocument);
                        await validateDocument(notary, repository, notarizedDocument);
                        document = notarizedDocument.getValue('$component');
                        cache.createDocument(documentId, document);
                    }
                }
                return document;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$retrieveDocument',
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
                validateParameter('$checkoutDocument', 'citation', citation);
                validateParameter('$checkoutDocument', 'level', level);

                // create the draft citation
                const documentVersion = citation.getValue('$version');
                const draftVersion = bali.version.nextVersion(documentVersion, level);

                // make sure that there is no document already referenced by the draft citation
                const draftId = citation.getValue('$tag').getValue() + draftVersion;
                if (cache.documentExists(draftId) || await repository.documentExists(draftId) || await repository.draftExists(draftId)) {
                    throw bali.exception({
                        $module: '$NebulaAPI',
                        $function: '$checkoutDocument',
                        $exception: '$versionExists',
                        $documentId: '"' + draftId + '"',
                        $text: '"A committed version of the document referenced by the citation already exists."'
                    });
                }

                // retrieve the document to be checked out
                const documentId = extractId(citation);
                const source = await repository.fetchDocument(documentId);
                if (source === undefined) {
                    throw bali.exception({
                        $module: '$NebulaAPI',
                        $function: '$checkoutDocument',
                        $exception: '$documentMissing',
                        $documentId: '"' + documentId + '"',
                        $text: '"A committed version of the document referenced by the draft citation already exists."'
                    });
                }
                const notarizedDocument = bali.parse(source);

                // validate and cache the document
                await validateCitation(notary, citation, notarizedDocument);
                await validateDocument(notary, repository, notarizedDocument);
                const document = notarizedDocument.getValue('$component');
                cache.createDocument(documentId, document);

                // store a draft copy of the document in the repository (NOTE: drafts are not cached)
                const draft = bali.duplicate(document);
                draft.getParameters().setParameter('$version', draftVersion);
                const notarizedDraft = await notary.signComponent(draft, citation);
                const draftCitation = await notary.citeDocument(notarizedDraft);
                await repository.saveDraft(draftId, notarizedDraft);

                return draftCitation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$checkoutDocument',
                    $exception: '$unexpected',
                    $accountId: notary.getAccountId(),
                    $text: bali.text('An unexpected error occurred while attempting to checkout a document.')
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
                validateParameter('$publishEvent', 'event', event);
                const notarizedEvent = await notary.signComponent(event);
                await repository.queueMessage(EVENT_QUEUE_ID, notarizedEvent);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$publishEvent',
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
                validateParameter('$sendMessage', 'target', target);
                validateParameter('$sendMessage', 'message', message);
                message.setValue('$target', target);
                const notarizedMessage = await notary.signComponent(message);
                await repository.queueMessage(SEND_QUEUE_ID, notarizedMessage);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$sendMessage',
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
                validateParameter('$queueMessage', 'queue', queue);
                validateParameter('$queueMessage', 'message', message);
                const notarizedMessage = await notary.signComponent(message);
                const queueId = queue.getValue();
                await repository.queueMessage(queueId, notarizedMessage);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$queueMessage',
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
                validateParameter('$receiveMessage', 'queue', queue);
                const queueId = queue.getValue();
                const source = await repository.dequeueMessage(queueId);
                if (source) {
                    // validate the document
                    const notarizedMessage = bali.parse(source);
                    await validateDocument(notary, repository, notarizedMessage);
                    const message = notarizedMessage.getValue('$component');
                    return message;
                }
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$receiveMessage',
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


// PRIVATE HELPER FUNCTIONS

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
 * @throws {Exception} The digest generated for the document does not match the digest
 * contained within the document citation.
 */
const validateCitation = async function(notary, citation, document) {
    const matches = await notary.citationMatches(citation, document);
    if (!matches) {
        throw bali.exception({
            $module: '$NebulaAPI',
            $function: '$validateCitation',
            $exception: '$documentModified',
            $citation: citation,
            $document: document,
            $text: '"The cited document was modified after it was committed."'
        });
    }
};


/**
 * This function validates a notarized document. It makes sure that all notary seals
 * attached to the document are valid. If any seal is not valid an exception is thrown.
 * 
 * @param {Object} notary The notary to be used for validating the document.
 * @param {Object} repository The document repository containing the certificates.
 * @param {Catalog} document The notarized document to be validated.
 */
const validateDocument = async function(notary, repository, document) {
    var certificateCitation = document.getValue('$certificate');
    while (certificateCitation && !certificateCitation.isEqualTo(bali.NONE) && !certificateCitation.getValue('$digest').isEqualTo(bali.NONE)) {

        // validate the document citation to the previous version of the document
        const previousCitation = document.getValue('$previous');
        if (previousCitation && !previousCitation.isEqualTo(bali.NONE)) {
            const previousId = extractId(previousCitation);
            source = await repository.fetchDocument(previousId);
            if (!source) {
                throw bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$validateDocument',
                    $exception: '$documentMissing',
                    $previousId: '"' + previousId + '"',
                    $text: '"The previous version of the document does not exist."'
                });
            }
            const previousDocument = bali.parse(source);
            if (!(await notary.citationMatches(previousCitation, previousDocument))) {
                throw bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$validateDocument',
                    $exception: '$invalidCitation',
                    $citation: previousCitation,
                    $text: '"The digest in the previous document citation does not match the previous document."'
                });
            }
            // don't cache the previous version since it has not been validated!
        }

        // check for a self signed document
        if (!certificateCitation || certificateCitation.isEqualTo(bali.NONE)) {
            certificate = document.getValue('$component');
            if (certificate && (await notary.documentIsValid(document, certificate))) return;
            throw bali.exception({
                $module: '$NebulaAPI',
                $function: '$validateDocument',
                $exception: '$documentInvalid',
                $document: document,
                $text: '"The self signed document is invalid."'
            });
        }

        // fetch and validate if necessary the certificate
        const certificateId = extractId(certificateCitation);
        certificate = cache.fetchCertificate(certificateId);
        if (!certificate) {
            source = await repository.fetchCertificate(certificateId);
            if (!source) {
                throw bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$validateDocument',
                    $exception: '$certificateMissing',
                    $certificateId: '"' + certificateId + '"',
                    $text: '"The certificate for the document does not exist."'
                });
            }
            const certificateDocument = bali.parse(source);
            if (!(await notary.citationMatches(certificateCitation, certificateDocument))) {
                throw bali.exception({
                    $module: '$NebulaAPI',
                    $function: '$validateDocument',
                    $exception: '$invalidCitation',
                    $citation: certificateCitation,
                    $text: '"The digest in the certificate citation does not match the certificate."'
                });
            }
            // validate the certificate document
            await validateDocument(notary, repository, certificateDocument);
            certificate = certificateDocument.getValue('$component');
            cache.createCertificate(certificateId, certificate);
        }

        // validate the document
        const valid = await notary.documentIsValid(document, certificate);
        if (!valid) {
            throw bali.exception({
                $module: '$NebulaAPI',
                $function: '$validateDocument',
                $exception: '$documentInvalid',
                $document: document,
                $text: '"The signature on the document is invalid."'
            });
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
};


/*
 * This section defines the caches for the client side API.
 * Since all documents are immutable, there are no cache consistency issues.
 * The caching rules are as follows:
 * <pre>
 * 1) The cache is always checked before downloading a document.
 * 2) A downloaded document is always validated before use.
 * 3) A validated document is always cached locally.
 * 4) The cache will delete the oldest document when it is full.
 * </pre>
 */

const cache = {

    MAX_CERTIFICATES: 64,
    MAX_DOCUMENTS: 128,
    MAX_TYPES: 256,

    certificates: new Map(),
    documents: new Map(),
    types: new Map(),

    certificateExists: function(certificateId) {
        return this.certificates.has(certificateId);
    },

    fetchCertificate: function(certificateId) {
        return this.certificates.get(certificateId);
    },

    createCertificate: function(certificateId, certificate) {
        if (this.certificates.size > this.MAX_CERTIFICATES) {
            // delete the first (oldest) cached certificate
            const key = this.certificates.keys().next().getValue();
            this.certificates.delete(key);
        }
        this.certificates.set(certificateId, certificate);
    },

    documentExists: function(documentId) {
        return this.documents.has(documentId);
    },

    fetchDocument: function(documentId) {
        return this.documents.get(documentId);
    },

    createDocument: function(documentId, document) {
        if (this.documents.size > this.MAX_DOCUMENTS) {
            // delete the first (oldest) cached document
            const key = this.documents.keys().next().getValue();
            this.documents.delete(key);
        }
        this.documents.set(documentId, document);
    },

    typeExists: function(typeId) {
        return this.types.has(typeId);
    },

    fetchType: function(typeId) {
        return this.types.get(typeId);
    },

    createType: function(typeId, type) {
        if (this.types.size > this.MAX_TYPES) {
            // delete the first (oldest) cached type
            const key = this.types.keys().next().getValue();
            this.types.delete(key);
        }
        this.types.set(typeId, type);
    }
};


// PRIVATE FUNCTIONS

const validateParameter = function(functionName, parameterName, parameterValue, type) {
    type = type || parameterName;
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
                if (parameterValue.getTypeId && parameterValue.isEqualTo(bali.NONE)) return;
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 5) {
                    validateParameter(functionName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version');
                    validateParameter(functionName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment');
                    validateParameter(functionName, parameterName + '.tag', parameterValue.getValue('$tag'), 'tag');
                    validateParameter(functionName, parameterName + '.version', parameterValue.getValue('$version'), 'version');
                    validateParameter(functionName, parameterName + '.digest', parameterValue.getValue('$digest'), 'binary');
                    const parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() === 1) {
                        validateParameter(functionName, parameterName + '.parameters.type', parameters.getParameter('$type'), 'name');
                        if (parameters.getParameter('$type').toString().startsWith('/bali/types/Citation/v')) return;
                    }
                }
                break;
            case 'certificate':
                // A certificate must have the following:
                //  * a parameterized type of /bali/types/Certificate/v...
                //  * exactly four specific attributes
                //  * and be parameterized with exactly 5 specific parameters
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 4) {
                    validateParameter(functionName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version');
                    validateParameter(functionName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment');
                    validateParameter(functionName, parameterName + '.account', parameterValue.getValue('$account'), 'tag');
                    validateParameter(functionName, parameterName + '.publicKey', parameterValue.getValue('$publicKey'), 'binary');
                    const parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() === 5) {
                        validateParameter(functionName, parameterName + '.parameters.type', parameters.getParameter('$type'), 'name');
                        validateParameter(functionName, parameterName + '.parameters.tag', parameters.getParameter('$tag'), 'tag');
                        validateParameter(functionName, parameterName + '.parameters.version', parameters.getParameter('$version'), 'version');
                        validateParameter(functionName, parameterName + '.parameters.permissions', parameters.getParameter('$permissions'), 'name');
                        validateParameter(functionName, parameterName + '.parameters.previous', parameters.getParameter('$previous'), 'citation');
                        if (parameters.getParameter('$type').toString().startsWith('/bali/types/Certificate/v') &&
                            parameters.getParameter('$permissions').toString().startsWith('/bali/permissions/Public/v')) return;
                    }
                }
                break;
            case 'aem':
                // An authenticated encrypted message (AEM) must have the following:
                //  * a parameterized type of /bali/types/AEM/v...
                //  * exactly six specific attributes
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 6) {
                    validateParameter(functionName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version');
                    validateParameter(functionName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment');
                    validateParameter(functionName, parameterName + '.seed', parameterValue.getValue('$seed'), 'binary');
                    validateParameter(functionName, parameterName + '.iv', parameterValue.getValue('$iv'), 'binary');
                    validateParameter(functionName, parameterName + '.auth', parameterValue.getValue('$auth'), 'binary');
                    validateParameter(functionName, parameterName + '.ciphertext', parameterValue.getValue('$ciphertext'), 'binary');
                    const parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() === 1) {
                        validateParameter(functionName, parameterName + '.parameters.type', parameters.getParameter('$type'), 'name');
                        if (parameters.getParameter('$type').toString().startsWith('/bali/types/AEM/v')) return;
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
                    validateParameter(functionName, parameterName + '.component', parameterValue.getValue('$component'), 'component');
                    validateParameter(functionName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version');
                    validateParameter(functionName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment');
                    validateParameter(functionName, parameterName + '.certificate', parameterValue.getValue('$certificate'), 'citation');
                    validateParameter(functionName, parameterName + '.signature', parameterValue.getValue('$signature'), 'binary');
                    var parameters = parameterValue.getValue('$component').getParameters();
                    if (parameters) {
                        if (parameters.getParameter('$type')) validateParameter(functionName, parameterName + '.parameters.type', parameters.getParameter('$type'), 'name');
                        validateParameter(functionName, parameterName + '.parameters.tag', parameters.getParameter('$tag'), 'tag');
                        validateParameter(functionName, parameterName + '.parameters.version', parameters.getParameter('$version'), 'version');
                        validateParameter(functionName, parameterName + '.parameters.permissions', parameters.getParameter('$permissions'), 'name');
                        validateParameter(functionName, parameterName + '.parameters.previous', parameters.getParameter('$previous'), 'citation');
                        parameters = parameterValue.getParameters();
                        if (parameters && parameters.getSize() === 1) {
                            if (parameters.getParameter('$type').toString().startsWith('/bali/types/Document/v')) return;
                        }
                    }
                }
                break;
        }
    }
    const exception = bali.exception({
        $module: '$DigitalNotary',
        $function: functionName,
        $exception: '$invalidParameter',
        $parameter: bali.text(parameterName),
        $value: parameterValue ? bali.text(parameterValue.toString()) : bali.NONE,
        $text: bali.text('An invalid parameter value was passed to the function.')
    });
    throw exception;
    */
};
