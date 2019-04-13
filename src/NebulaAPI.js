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
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$getCitation',
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
                if (!(await notary.documentIsValid(account, certificate))) {
                    throw bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$registerAccount',
                        $exception: '$accountInvalid',
                        $document: account,
                        $certificate: certificate,
                        $text: '"The signed account document is invalid."'
                    });
                }
                const accountCitation = await notary.citeDocument(account);
                const accountId = notary.getAccountId();
                if (await repository.accountExists(accountId)) {
                    throw bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$registerAccount',
                        $exception: '$versionExists',
                        $accountId: accountId,
                        $text: '"A committed version of the account already exists."'
                    });
                }
                const certificateCitation = await notary.citeDocument(certificate);
                const certificateId = extractId(certificateCitation);
                if (await repository.certificateExists(certificateId)) {
                    throw bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$registerAccount',
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
                        certificate = bali.parse(source);
                        await validateCitation(notary, citation, certificate);
                        await validateDocument(notary, repository, certificate);
                        cache.createCertificate(certificateId, certificate);
                    }
                }
                return certificate;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$retrieveCertificate',
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
                        const type = bali.parse(source);
                        await validateCitation(notary, citation, type);
                        await validateDocument(notary, repository, type);
                        cache.createType(typeId, type);
                    }
                }
                return type.getValue('$component');
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$retrieveType',
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
                type = await notary.signComponent(type);
                const typeCitation = await notary.citeDocument(type);
                const typeId = extractId(typeCitation);
                if (await repository.typeExists(typeId)) {
                    throw bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$commitType',
                        $exception: '$versionExists',
                        $tag: typeCitation.getValue('$tag'),
                        $version: typeCitation.getValue('$version'),
                        $text: '"A committed version of the type document referenced by the citation already exists."'
                    });
                }
                await repository.createType(typeId, type);
                cache.createType(typeId, type);
                return typeCitation;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$commitType',
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
                    const draft = bali.parse(source);
                    await validateCitation(notary, citation, draft);
                    await validateDocument(notary, repository, draft);
                    // we don't cache drafts since they are mutable
                    return draft.getValue('$component');
                }
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
         * This method saves in the Bali Nebula™ a draft document.
         * 
         * @param {Component} draft The draft document to be saved.
         * @returns {Catalog} A document citation for the draft document.
         */
        saveDraft: async function(draft) {
            try {
                validateParameter('$saveDraft', 'draft', draft);
                draft = await notary.signComponent(draft);
                const draftCitation = await notary.citeDocument(draft);
                const draftId = extractId(draftCitation);
                if (cache.documentExists(draftId) || await repository.documentExists(draftId)) {
                    throw bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$saveDraft',
                        $exception: '$versionExists',
                        $tag: draftCitation.getValue('$tag'),
                        $version: draftCitation.getValue('$version'),
                        $text: '"A committed version of the document referenced by the citation already exists."'
                    });
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
                validateParameter('$commitDocument', 'document', document);
                document = await notary.signComponent(document);
                const documentCitation = await notary.citeDocument(document);
                const documentId = extractId(documentCitation);
                if (cache.documentExists(documentId) || await repository.documentExists(documentId)) {
                    throw bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$commitDocument',
                        $exception: '$versionExists',
                        $documentId: '"' + documentId + '"',
                        $text: '"A committed version of the document referenced by the citation already exists."'
                    });
                }
                await repository.createDocument(documentId, document);
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
                validateParameter('$retrieveDocument', 'citation', citation);
                const documentId = extractId(citation);
                var document = cache.fetchDocument(documentId);
                if (!document) {
                    const source = await repository.fetchDocument(documentId);
                    if (source) {
                        document = bali.parse(source);
                        await validateCitation(notary, citation, document);
                        await validateDocument(notary, repository, document);
                        cache.createDocument(documentId, document);
                    }
                }
                return document.getValue('$component');
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
                validateParameter('$checkoutDocument', 'citation', citation);
                validateParameter('$checkoutDocument', 'level', level);

                // create the draft citation
                const documentVersion = citation.getValue('$version');
                const draftVersion = bali.version.nextVersion(documentVersion, level);

                // make sure that there is no document already referenced by the draft citation
                const draftId = citation.getValue('$tag').getValue() + draftVersion;
                if (cache.documentExists(draftId) || await repository.documentExists(draftId) || await repository.draftExists(draftId)) {
                    throw bali.exception({
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$checkoutDocument',
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
                        $module: '/bali/services/NebulaAPI',
                        $procedure: '$checkoutDocument',
                        $exception: '$documentMissing',
                        $documentId: '"' + documentId + '"',
                        $text: '"A committed version of the document referenced by the draft citation already exists."'
                    });
                }
                const document = bali.parse(source);

                // validate and cache the document
                await validateCitation(notary, citation, document);
                await validateDocument(notary, repository, document);
                cache.createDocument(documentId, document);

                // store a draft copy of the document in the repository (NOTE: drafts are not cached)
                var draft = bali.duplicate(document.getValue('$component'));
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
         * This method publishes the specified event in the Bali Nebula™.
         * Any component that has registered event handlers for this type of event
         * will be automatically notified.
         * 
         * @param {Catalog} event The Bali catalog documenting the event.
         */
        publishEvent: async function(event) {
            try {
                validateParameter('$publishEvent', 'event', event);
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
                validateParameter('$sendMessage', 'target', target);
                validateParameter('$sendMessage', 'message', message);
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
                validateParameter('$queueMessage', 'queue', queue);
                validateParameter('$queueMessage', 'message', message);
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
                validateParameter('$receiveMessage', 'queue', queue);
                const queueId = queue.getValue();
                const source = await repository.dequeueMessage(queueId);
                if (source) {
                    // validate the document
                    const message = bali.parse(source);
                    await validateDocument(notary, repository, message);
                    return message.getValue('$component');
                }
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
            $module: '/bali/services/NebulaAPI',
            $procedure: '$validateCitation',
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
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$validateDocument',
                    $exception: '$documentMissing',
                    $previousId: '"' + previousId + '"',
                    $text: '"The previous version of the document does not exist."'
                });
            }
            const previousDocument = bali.parse(source);
            if (!(await notary.citationMatches(previousCitation, previousDocument))) {
                throw bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$validateDocument',
                    $exception: '$invalidCitation',
                    $citation: previousCitation,
                    $text: '"The digest in the previous document citation does not match the previous document."'
                });
            }
            // don't cache the previous version since it has not been validated!
        }

        // check for a self signed document
        if (certificateCitation.isEqualTo(bali.NONE)) {
            if (await notary.documentIsValid(document, document)) return;
            throw bali.exception({
                $module: '/bali/services/NebulaAPI',
                $procedure: '$validateDocument',
                $exception: '$documentInvalid',
                $document: document,
                $text: '"The self signed document is invalid."'
            });
        }

        // fetch and validate if necessary the certificate
        const certificateId = extractId(certificateCitation);
        var certificate = cache.fetchCertificate(certificateId);
        if (!certificate) {
            const source = await repository.fetchCertificate(certificateId);
            if (!source) {
                throw bali.exception({
                    $module: '/bali/services/NebulaAPI',
                    $procedure: '$validateDocument',
                    $exception: '$certificateMissing',
                    $certificateId: '"' + certificateId + '"',
                    $text: '"The certificate for the document does not exist."'
                });
            }
            certificate = bali.parse(source);
            await validateCitation(notary, certificateCitation, certificate);
            await validateDocument(notary, repository, certificate);
            cache.createCertificate(certificateId, certificate);
        }

        // validate the document
        const valid = await notary.documentIsValid(document, certificate);
        if (!valid) {
            throw bali.exception({
                $module: '/bali/services/NebulaAPI',
                $procedure: '$validateDocument',
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

const validateParameter = function(procedureName, parameterName, parameterValue, type) {
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
            case 'aem':
                // An authenticated encrypted message (AEM) must have the following:
                //  * a parameterized type of /bali/types/AEM/v...
                //  * exactly six specific attributes
                if (parameterValue.getTypeId && parameterValue.getTypeId() === bali.types.CATALOG && parameterValue.getSize() === 6) {
                    validateParameter(procedureName, parameterName + '.protocol', parameterValue.getValue('$protocol'), 'version');
                    validateParameter(procedureName, parameterName + '.timestamp', parameterValue.getValue('$timestamp'), 'moment');
                    validateParameter(procedureName, parameterName + '.seed', parameterValue.getValue('$seed'), 'binary');
                    validateParameter(procedureName, parameterName + '.iv', parameterValue.getValue('$iv'), 'binary');
                    validateParameter(procedureName, parameterName + '.auth', parameterValue.getValue('$auth'), 'binary');
                    validateParameter(procedureName, parameterName + '.ciphertext', parameterValue.getValue('$ciphertext'), 'binary');
                    const parameters = parameterValue.getParameters();
                    if (parameters && parameters.getSize() === 1) {
                        validateParameter(procedureName, parameterName + '.parameters.type', parameters.getParameter('$Type'), 'name');
                        if (parameters.getParameter('$Type').toString().startsWith('/bali/types/AEM/v')) return;
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
        $value: parameterValue ? bali.text(parameterValue.toString()) : bali.NONE,
        $text: bali.text('An invalid parameter value was passed to the function.')
    });
    throw exception;
    */
};
