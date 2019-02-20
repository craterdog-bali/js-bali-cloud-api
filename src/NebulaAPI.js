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
 * @param {Object} notary An object that implements the API for the digital notary.
 * @param {Object} repository An object that implements the API for the document repository.
 * @returns {Object} An object that implements the API for the Bali Nebula™.
 */
exports.api = function(notary, repository) {
    const SEND_QUEUE_TAG = bali.parse('#JXT095QY01HBLHPAW04ZR5WSH41MWG4H');
    const EVENT_QUEUE_TAG = bali.parse('#3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43');

    // return the client API instance
    return {

        /**
         * This method retrieves from the Bali Nebula™ the certificate citation
         * for this client.
         * 
         * @returns {Catalog} The certificate citation for this client.
         */
        retrieveCitation: function() {
            const citation = notary.getCitation();
            return citation;
        },
        
        /**
         * This method retrieves from the Bali Nebula™ the notary certificate
         * for the specified certificate citation.
         * 
         * @param {Catalog} citation The certificate citation for the desired notary certificate.
         * @returns {Catalog} The desired notary certificate.
         */
        retrieveCertificate: function(citation) {
            const certificateId = extractId(citation);
            var certificate = cache.fetchCertificate(certificateId);
            if (!certificate) {
                const source = repository.fetchCertificate(certificateId);
                if (source) {
                    const notarizedCertificate = bali.parse(source);
                    validateCertificate(notary, citation, notarizedCertificate);
                    certificate = notarizedCertificate.getValue('$content');
                    cache.storeCertificate(certificateId, certificate);
                }
            }
            return certificate;
        },

        /**
         * This method retrieves from the Bali Nebula™ the compiled type document
         * for the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired compiled
         * type document.
         * @returns {Catalog} The compiled type document.
         */
        retrieveType: function(citation) {
            const typeId = extractId(citation);
            var type = cache.fetchType(typeId);
            if (!type) {
                const source = repository.fetchType(typeId);
                if (source) {
                    const notarizedType = bali.parse(source);
                    validateDocument(notary, repository, notarizedType);
                    type = notarizedType.getValue('$content');
                    cache.storeType(typeId, type);
                }
            }
            return type;
        },

        /**
         * This method commits to the Bali Nebula™ the specified compiled type
         * document to be associated with the specified document citation. This method requires
         * the account calling it to have additional privileges.
         * 
         * @param {Catalog} type A catalog containing the compiled type to be committed.
         * @param {Catalog} previous A document citation for the previous version of the type.
         * @returns {Catalog} A document citation for the committed type document.
         */
        commitType: function(type, previous) {
            const notarizedType = notary.notarizeComponent(type, previous);
            const typeCitation = notary.citeDocument(notarizedType);
            const typeId = extractId(typeCitation);
            if (repository.typeExists(typeId)) {
                throw bali.exception({
                    $exception: '$typeExists',
                    $tag: typeCitation.getValue('$tag'),
                    $version: typeCitation.getValue('$version'),
                    $message: '"The version of the type being committed already exists."'
                });
            }
            repository.storeType(typeId, notarizedType);
            type = notarizedType.getValue('$content');
            cache.storeType(typeId, type);
            return typeCitation;
        },

        /**
         * This method creates in the Bali Nebula™ a new draft document. If no
         * draft content is provided, an empty catalog is created.
         * 
         * @param {Component} draft An optional component that is to be used as
         * the content for the new draft document. 
         * @returns {Catalog} A document citation for the new draft document.
         */
        createDraft: function(draft) {
            draft = draft || bali.catalog({}, bali.parameters({}));
            const tag = bali.tag();
            const notarizedDraft = notary.notarizeComponent(draft);
            const draftCitation = notary.citeDocument(notarizedDraft);
            const draftId = extractId(draftCitation);
            repository.storeDraft(draftId, notarizedDraft);
            // we don't cache drafts since they are mutable
            return draftCitation;
        },

        /**
         * This method retrieves from the Bali Nebula™ the saved draft document
         * associated with the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired draft document.
         * @returns {Component} The desired draft document.
         */
        retrieveDraft: function(citation) {
            const documentId = extractId(citation);
            const source = repository.fetchDraft(documentId);
            if (source) {
                const notarizedDraft = bali.parse(source);
                validateDocument(notary, repository, notarizedDraft);
                const draft = notarizedDraft.getValue('$content');
                // we don't cache drafts since they are mutable
                return draft;
            }
        },

        /**
         * This method saves to the Bali Nebula™ the specified draft document
         * to be associated with the specified document citation.
         * 
         * @param {Component} draft The draft document to be saved.
         * @returns {Catalog} A document citation for the updated draft document.
         */
        saveDraft: function(draft) {
            const notarizedDraft = notary.notarizeComponent(draft);
            const draftCitation = notary.citeDocument(notarizedDraft);
            const documentId = extractId(draftCitation);
            if (cache.documentExists(documentId) || repository.documentExists(documentId)) {
                throw bali.exception({
                    $module: '$NebulaAPI',
                    $procedure: '$saveDraft',
                    $exception: '$typeExists',
                    $tag: draftCitation.getValue('$tag'),
                    $version: draftCitation.getValue('$version'),
                    $message: '"The version of the type being committed already exists."'
                });
            }
            repository.storeDraft(documentId, notarizedDraft);
            // we don't cache drafts since they are mutable
            return draftCitation;
        },

        /**
         * This method deletes from the Bali Nebula™ the saved draft document
         * associated with the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the draft document to be deleted.
         */
        discardDraft: function(citation) {
            const documentId = extractId(citation);
            repository.deleteDraft(documentId);
        },

        /**
         * This method commits to the Bali Nebula™ the specified draft document
         * to be associated with the specified document citation.
         * 
         * @param {Component} document The draft document to be committed.
         * @param {Catalog} previous A document citation for the previous version of the document.
         * @returns {Catalog} The updated citation for the committed document.
         */
        commitDocument: function(document, previous) {
            const notarizedDocument = notary.notarizeComponent(document, previous);
            const documentCitation = notary.citeDocument(notarizedDocument);
            const documentId = extractId(documentCitation);
            if (cache.documentExists(documentId) || repository.documentExists(documentId)) {
                throw exception({
                    $module: '$NebulaAPI',
                    $function: '$commitDocument',
                    $exception: '$documentExists',
                    $documentId: '"' + documentId + '"',
                    $message: '"Attempted to commit a draft document that has already been committed."'
                });
            }
            repository.storeDocument(documentId, notarizedDocument);
            document = notarizedDocument.getValue('$content');
            cache.storeDocument(documentId, document);
            if (repository.draftExists(documentId)) repository.deleteDraft(documentId);
            return documentCitation;
        },

        /**
         * This method retrieves from the Bali Nebula™ the committed document
         * for the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired document.
         * @returns {Component} The desired document.
         */
        retrieveDocument: function(citation) {
            const documentId = extractId(citation);
            var document = cache.fetchDocument(documentId);
            if (!document) {
                const source = repository.fetchDocument(documentId);
                if (source) {
                    const notarizedDocument = bali.parse(source);
                    validateCitation(notary, citation, notarizedDocument);
                    validateDocument(notary, repository, notarizedDocument);
                    document = notarizedDocument.getValue('$content');
                    cache.storeDocument(documentId, document);
                }
            }
            return document;
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
        checkoutDocument: function(citation, level) {

            // create the draft citation
            const documentVersion = citation.getValue('$version');
            const draftVersion = bali.version.nextVersion(documentVersion, level);

            // make sure that there is no document already referenced by the draft citation
            const draftId = citation.getValue('$tag').toString() + draftVersion.toString();
            if (cache.documentExists(draftId) || repository.documentExists(draftId) || repository.draftExists(draftId)) {
                throw exception({
                    $module: '$NebulaAPI',
                    $function: '$checkoutDocument',
                    $exception: '$documentExists',
                    $documentId: '"' + draftId + '"',
                    $message: '"A committed version of the document referenced by the draft citation already exists."'
                });
            }

            // retrieve the document to be checked out
            const documentId = extractId(citation);
            const source = repository.fetchDocument(documentId);
            if (source === undefined) {
                throw exception({
                    $module: '$NebulaAPI',
                    $function: '$checkoutDocument',
                    $exception: '$documentMissing',
                    $documentId: '"' + documentId + '"',
                    $message: '"A committed version of the document referenced by the draft citation already exists."'
                });
            }
            const notarizedDocument = bali.parse(source);

            // validate and cache the document
            validateCitation(notary, citation, notarizedDocument);
            validateDocument(notary, repository, notarizedDocument);
            const document = notarizedDocument.getValue('$content');
            cache.storeDocument(documentId, document);

            // store a draft copy of the document in the repository (NOTE: drafts are not cached)
            const draft = bali.duplicate(document);
            draft.getParameters().setParameter('$version', draftVersion);
            const notarizedDraft = notary.notarizeComponent(draft, citation);
            const draftCitation = notary.citeDocument(notarizedDraft);
            repository.storeDraft(draftId, notarizedDraft);

            return draftCitation;
        },

        /**
         * This method publishes the specified event in the Bali Nebula™.
         * Any component that has registered event handlers for this type of event
         * will be automatically notified.
         * 
         * @param {Catalog} event The Bali catalog documenting the event.
         */
        publishEvent: function(event) {
            const notarizedEvent = notary.notarizeComponent(event);
            const eventCitation = notary.citeDocument(notarizedEvent);
            const eventId = extractId(eventCitation);
            repository.queueMessage(EVENT_QUEUE_TAG, eventId, notarizedEvent);
        },

        /**
         * This method sends the specified message to the document residing in the Bali
         * Nebula™ that is referenced by the specified target document citation.
         * The message is sent asynchronously so there is no response.
         * 
         * @param {Catalog} targetCitation A document citation referencing the document containing
         * the target component of the message.
         * @param {Catalog} message The message to be sent to the target component.
         */
        sendMessage: function(targetCitation, message) {
            message.setValue('$target', targetCitation);
            const notarizedMessage = notary.notarizeComponent(message);
            const messageCitation = notary.citeDocument(notarizedMessage);
            const messageId = extractId(messageCitation);
            repository.queueMessage(SEND_QUEUE_TAG, messageId, notarizedMessage);
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
        queueMessage: function(queue, message) {
            const notarizedMessage = notary.notarizeComponent(message);
            const messageCitation = notary.citeDocument(notarizedMessage);
            const messageId = extractId(messageCitation);
            repository.queueMessage(queue, messageId, notarizedMessage);
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
        receiveMessage: function(queue) {
            const source = repository.dequeueMessage(queue);
            if (source) {
                // validate the document
                const notarizedMessage = bali.parse(source);
                validateDocument(notary, repository, notarizedMessage);
                const message = notarizedMessage.getValue('$content');
                return message;
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
function extractId(catalog) {
    const id = catalog.getValue('$tag').toString() + catalog.getValue('$version').toString();
    return id;
}


/**
 * This function extracts a document citation from the parameters for the specified
 * component.
 * 
 * @param {Component} component The component to be cited.
 * @returns {Catalog} The document citation for the component.
 */
function extractCitation(component) {
    var protocol, tag, version, digest;
    const parameters = component.getParameters();
    if (parameters) {
        protocol = parameters.getParameter('$protocol') || bali.version();
        tag = parameters.getParameter('$tag') || bali.tag();
        version = parameters.getParameter('$version') || bali.version();
        digest = parameters.getParameter('$digest') || bali.NONE;
    }
    const citation = bali.catalog({
        $protocol: protocol,
        $tag: tag,
        $version: version,
        $digest: digest
    });
    return citation;
}


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
function validateCitation(notary, citation, document) {
    if (!notary.documentMatches(document, citation)) {
        throw exception({
            $module: '$NebulaAPI',
            $function: '$validateCitation',
            $exception: '$documentModified',
            $citation: citation,
            $document: document,
            $message: '"The cited document was modified after it was committed."'
        });
    }
}


/**
 * This function validates a self-notarized certificate. It makes sure that the specified
 * document citation references the certificate; and it makes sure that the notary seal
 * on the certificate was generated by the private notary key associated with the public
 * key that is embedded in the certificate. If either condition is not true an exception
 * is thrown.
 * 
 * @param {Object} notary The notary to be used for validating the certificate.
 * @param {Catalog} citation A document citation for the notary certificate that is
 * specified.
 * @param {Catalog} certificate A self-notarized certificate containing the public key
 * associated with the private notary key that notarized the certificate.
 */
function validateCertificate(notary, citation, certificate) {
    if (!notary.documentMatches(certificate, citation)) {
        throw exception({
            $module: '$NebulaAPI',
            $function: '$validateCertificate',
            $exception: '$documentModified',
            $citation: citation,
            $certificate: certificate,
            $message: '"The certificate was modified after it was committed."'
        });
    }
    if (!notary.documentIsValid(certificate, certificate.getValue('$content'))) {
        throw exception({
            $module: '$NebulaAPI',
            $function: '$validateCertificate',
            $exception: '$documentInvalid',
            $certificate: certificate,
            $message: '"The signature on the certificate is invalid."'
        });
    }
}


/**
 * This function validates a notarized document. It makes sure that all notary seals
 * attached to the document are valid. If any seal is not valid an exception is thrown.
 * 
 * @param {Object} notary The notary to be used for validating the document.
 * @param {Object} repository The document repository containing the certificates.
 * @param {Catalog} document The notarized document to be validated.
 */
function validateDocument(notary, repository, document) {
    var certificateCitation = document.getValue('$certificate');
    while (certificateCitation && !certificateCitation.getValue('$digest').isEqualTo(bali.NONE)) {
        const certificateId = extractId(certificateCitation);
        var certificate = cache.fetchCertificate(certificateId);
        if (!certificate) {
            const source = repository.fetchCertificate(certificateId);
            if (source) {
                const certificateDocument = bali.parse(source);
                validateCertificate(notary, certificateCitation, certificateDocument);
                certificate = certificateDocument.getValue('$content');
                cache.storeCertificate(certificateId, certificate);
            } else {
                throw exception({
                    $module: '$NebulaAPI',
                    $function: '$validateDocument',
                    $exception: '$certificateMissing',
                    $certificateId: '"' + certificateId + '"',
                    $message: '"The certificate for the document does not exist."'
                });
            }
        }
        if (!notary.documentIsValid(document, certificate)) {
            throw exception({
                $module: '$NebulaAPI',
                $function: '$validateDocument',
                $exception: '$documentInvalid',
                $document: document,
                $message: '"The signature on the document is invalid."'
            });
        }
        try {
            document = document.getValue('$content');
            certificateCitation = document.getValue('$certificate');
        } catch (e) {
            // we have reached the root content so we are done
            break;
        }
    }
}


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

    storeCertificate: function(certificateId, certificate) {
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

    storeDocument: function(documentId, document) {
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

    storeType: function(typeId, type) {
        if (this.types.size > this.MAX_TYPES) {
            // delete the first (oldest) cached type
            const key = this.types.keys().next().getValue();
            this.types.delete(key);
        }
        this.types.set(typeId, type);
    }
};
