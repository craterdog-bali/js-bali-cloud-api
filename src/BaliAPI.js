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
 * used to by registered accounts to access the Bali Cloud Environment™. The implementation
 * requires that objects implementing the digital notary API and the document repository API
 * be passed into the constructor.
 */

/*
 * This library provides useful functions for accessing the Bali Environment™.
 */
var bali = require('bali-component-framework');
var NotarizedDocument = require('bali-digital-notary/src/NotarizedDocument').NotarizedDocument;


/**
 * This function returns an object that implements the API for the Bali Cloud Environment™.
 *
 * @param {Object} notary An object that implements the API for the digital notary.
 * @param {Object} repository An object that implements the API for the document repository.
 * @returns {Object} An object that implements the API for the Bali Cloud Environment™.
 */
exports.api = function(notary, repository) {
    var SEND_QUEUE_TAG = new bali.Tag('#JXT095QY01HBLHPAW04ZR5WSH41MWG4H');
    var EVENT_QUEUE_TAG = new bali.Tag('#3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43');

    // return the client API instance
    return {

        /**
         * This method retrieves from the Bali Cloud Environment™ the certificate citation
         * for this client.
         * 
         * @returns {Catalog} The certificate citation for this client.
         */
        retrieveCitation: function() {
            var citation = notary.getNotaryCitation();
            return citation;
        },
        
        /**
         * This method retrieves from the Bali Cloud Environment™ the notary certificate
         * for the specified certificate citation.
         * 
         * @param {Catalog} citation The certificate citation for the desired notary certificate.
         * @returns {Catalog} The desired notary certificate.
         */
        retrieveCertificate: function(citation) {
            var certificateId = extractId(citation);
            var certificate = cache.fetchCertificate(certificateId);
            if (!certificate) {
                var source = repository.fetchCertificate(certificateId);
                if (source) {
                    var document = NotarizedDocument.fromString(source);
                    validateCertificate(notary, citation, document);
                    certificate = bali.parser.parseDocument(document.content);
                    cache.storeCertificate(certificateId, certificate);
                }
            }
            return certificate;
        },

        /**
         * This method retrieves from the Bali Cloud Environment™ the compiled type document
         * for the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired compiled
         * type document.
         * @returns {Catalog} The compiled type document.
         */
        retrieveType: function(citation) {
            var typeId = extractId(citation);
            var type = cache.fetchType(typeId);
            if (!type) {
                var source = repository.fetchType(typeId);
                if (source) {
                    var document = NotarizedDocument.fromString(source);
                    validateDocument(notary, repository, document);
                    type = bali.parser.parseDocument(document.content);
                    cache.storeType(typeId, type);
                }
            }
            return type;
        },

        /**
         * This method commits to the Bali Cloud Environment™ the specified compiled type
         * document to be associated with the specified document citation. This method requires
         * the account calling it to have additional privileges.
         * 
         * @param {Catalog} citation The document citation for the compiled type document.
         * @param {Catalog} type A catalog containing the compiled type to be committed.
         * @returns {Catalog} The new citation for the compiled type document.
         */
        commitType: function(citation, type) {
            var typeId = extractId(citation);
            // store the new version of the type in the repository
            if (repository.typeExists(typeId)) {
                throw new Error('API: The type being committed is already committed: ' + typeId);
            }
            var document = notary.notarizeDocument(citation, document);
            repository.storeType(typeId, document);
            cache.storeType(typeId, type);

            return citation;
        },

        /**
         * This method creates in the Bali Cloud Environment™ a new draft document. If no
         * document content is provided, an empty catalog is created.
         * 
         * @param {Component} content An optional component that is to be used as
         * the document content for the new draft document. 
         * @returns {Catalog} A document citation to the new empty draft document.
         */
        createDraft: function(content) {
            content = content || new bali.Catalog();
            var tag = new bali.Tag();
            var citation = notary.createCitation(tag);
            var draftId = extractId(citation);
            var document = notary.notarizeDocument(citation, content);
            repository.storeDraft(draftId, document);
            // we don't cache drafts since they are mutable
            return citation;
        },

        /**
         * This method retrieves from the Bali Cloud Environment™ the saved draft document
         * associated with the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired draft document.
         * @returns {Component} The desired draft document.
         */
        retrieveDraft: function(citation) {
            var documentId = extractId(citation);
            var draft;
            var source = repository.fetchDraft(documentId);
            if (source) {
                var document = NotarizedDocument.fromString(source);
                validateDocument(notary, repository, document);
                draft = bali.parser.parseDocument(document.content);
                // don't cache drafts since they are mutable
            }
            return draft;
        },

        /**
         * This method saves to the Bali Cloud Environment™ the specified draft document
         * to be associated with the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the draft document.
         * @param {Component} draft The draft document to be saved.
         * @returns {Catalog} A document citation to the updated draft document.
         */
        saveDraft: function(citation, draft) {
            var documentId = extractId(citation);
            if (cache.documentExists(documentId) || repository.documentExists(documentId)) {
                throw new Error('API: The draft being saved is already committed: ' + documentId);
            }
            var document = notary.notarizeDocument(citation, draft);
            repository.storeDraft(documentId, document);
            return citation;
        },

        /**
         * This method deletes from the Bali Cloud Environment™ the saved draft document
         * associated with the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the draft document to be deleted.
         */
        discardDraft: function(citation) {
            var documentId = extractId(citation);
            repository.deleteDraft(documentId);
        },

        /**
         * This method commits to the Bali Cloud Environment™ the specified draft document
         * to be associated with the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the draft document.
         * @param {Component} draft The draft document to be committed.
         * @returns {Catalog} The updated citation for the committed document.
         */
        commitDocument: function(citation, draft) {
            var documentId = extractId(citation);
            if (cache.documentExists(documentId) || repository.documentExists(documentId)) {
                throw new Error('API: The draft document being committed has already been committed: ' + documentId);
            }
            var document = notary.notarizeDocument(citation, draft);
            repository.storeDocument(documentId, document);
            cache.storeDocument(documentId, draft);
            if (repository.draftExists(documentId)) repository.deleteDraft(documentId);
            return citation;
        },

        /**
         * This method retrieves from the Bali Cloud Environment™ the committed document
         * for the specified document citation.
         * 
         * @param {Catalog} citation The document citation for the desired document.
         * @returns {Component} The desired document.
         */
        retrieveDocument: function(citation) {
            var documentId = extractId(citation);
            var content = cache.fetchDocument(documentId);
            if (!content) {
                var source = repository.fetchDocument(documentId);
                if (source) {
                    var document = NotarizedDocument.fromString(source);
                    validateCitation(notary, citation, document);
                    validateDocument(notary, repository, document);
                    content = bali.parser.parseDocument(document.content);
                    cache.storeDocument(documentId, content);
                }
            }
            return content;
        },

        /**
         * This method checks out from the Bali Cloud Environment™ a new draft of the
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
         * @returns {Catalog} The document citation to the new draft document.
         */
        checkoutDocument: function(citation, level) {
            // create the draft citation
            var documentVersion = citation.getValue('$version');
            var draftVersion = bali.Version.nextVersion(documentVersion, level);
            var draftCitation = new bali.Catalog();
            draftCitation.setValue('$protocol', citation.getValue('$protocol'));
            draftCitation.setValue('$tag', citation.getValue('$tag'));
            draftCitation.setValue('$version', draftVersion);
            draftCitation.setValue('$digest', bali.Template.NONE);

            // make sure that there is no document already referenced by the draft citation
            var draftId = extractId(draftCitation);
            if (cache.documentExists(draftId) || repository.documentExists(draftId) || repository.draftExists(draftCitation)) {
                throw new Error('API: A version of the document referenced by the draft citation already exists: ' + draftId);
            }

            // retrieve the document to be checked out
            var document, content;
            var documentId = extractId(citation);
            var source = repository.fetchDocument(documentId);
            if (source) {
                document = NotarizedDocument.fromString(source);
                validateCitation(notary, citation, document);
                validateDocument(notary, repository, document);
                content = bali.parser.parseDocument(document.content);
                cache.storeDocument(documentId, content);
            } else {
                throw new Error('API: The document being checked does not exist: ' + documentId);
            }

            // store a draft copy of the document in the repository (NOTE: drafts are not cached)
            var reference = notary.createReference(citation);
            var draft = notary.notarizeDocument(draftCitation, content, reference);
            repository.storeDraft(draftId, draft);

            return draftCitation;
        },

        /**
         * This method publishes the specified event in the Bali Cloud Environment™.
         * Any component that has registered event handlers for this type of event
         * will be automatically notified.
         * 
         * @param {Catalog} event The Bali catalog documenting the event.
         */
        publishEvent: function(event) {
            var eventId = new bali.Tag();
            event.setValue('$tag', eventId);
            var citation = notary.createCitation(eventId);
            var document = notary.notarizeDocument(citation, event);
            repository.queueMessage(EVENT_QUEUE_TAG, eventId, document);
        },

        /**
         * This method sends the specified message to the document residing in the Bali
         * Cloud Environment™ that is referenced by the specified target document citation.
         * The message is sent asynchronously so there is no response.
         * 
         * @param {Catalog} targetCitation A document citation referencing the document containing
         * the target component of the message.
         * @param {Catalog} message The message to be sent to the target component.
         */
        sendMessage: function(targetCitation, message) {
            var messageId = new bali.Tag();
            message.setValue('$tag', messageId);
            message.setValue('$target', targetCitation);
            var citation = notary.createCitation(messageId);
            var document = notary.notarizeDocument(citation, message);
            repository.queueMessage(SEND_QUEUE_TAG, messageId, document);
        },

        /**
         * This method places the specified message on the specified queue in the Bali
         * Cloud Environment™. The message will be received by another task using the
         * <code>receiveMessage(queue)</code> method with the same queue from the API.
         * 
         * @param {Tag} queue The unique tag identifying the queue on which to place
         * the message.
         * @param {Catalog} message The message to be placed on the queue.
         */
        queueMessage: function(queue, message) {
            var messageId = new bali.Tag();
            message.setValue('$tag', messageId);
            var citation = notary.createCitation(messageId);
            var document = notary.notarizeDocument(citation, message);
            repository.queueMessage(queue, messageId, document);
        },

        /**
         * This method receives a message from the specified queue in the Bali
         * Cloud Environment™. The message was placed there by another task using the
         * <code>queueMessage(queue, message)</code> method with the same queue from the API.
         * If there are no messages on the queue, the result of this call will be Template.NONE.
         * 
         * @param {Tag} queue The unique tag identifying the queue from which to receive
         * the message.
         * @returns {Component} The message received from the queue.
         */
        receiveMessage: function(queue) {
            var message;
            var source = repository.dequeueMessage(queue);
            if (source) {
                // validate the document
                var document = NotarizedDocument.fromString(source);
                validateDocument(notary, repository, document);
                message = bali.parser.parseDocument(document.content);
            }
            return message;
        }
    };
};


// PRIVATE HELPER FUNCTIONS

/**
 * This function extracts the '$tag' and '$version' attributes from the specified document
 * citation and uses them to form a unique identification string.
 * 
 * @param {Catalog} citation A document citation.
 * @returns {String} A unique identification string for the citation.
 */
function extractId(citation) {
    var id = citation.getValue('$tag').toString() + citation.getValue('$version').toString();
    return id;
}


function validateCitation(notary, citation, document) {
    if (!notary.documentMatches(citation, document)) {
        throw new Error('API: The following document has been modified since it was committed: ' + document);
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
 * @param {Catalog} citation A document citation to the notary certificate that is
 * specified.
 * @param {NotarizedDocument} document A self-notarized document containing the public key
 * associated with the private notary key that notarized the certificate.
 */
function validateCertificate(notary, citation, document) {
    if (!notary.documentMatches(citation, document)) {
        throw new Error('API: The following certificate has been modified since it was committed: ' + document);
    }
    var certificate = bali.parser.parseDocument(document.content);
    if (!notary.documentIsValid(certificate, document)) {
        throw new Error('API: The following certificate is invalid:\n' + document);
    }
}


/**
 * This function validates a notarized document. It makes sure that all notary seals
 * attached to the document are valid. If any seal is not valid an exception is thrown.
 * 
 * @param {Object} notary The notary to be used for validating the document.
 * @param {Object} repository The document repository containing the certificates.
 * @param {NotarizedDocument} document The notarized document to be validated.
 */
function validateDocument(notary, repository, document) {
    var certificateCitation = notary.extractCitation(document.certificateReference);
    while (!certificateCitation.getValue('$digest').isEqualTo(bali.Template.NONE)) {
        var certificateId = extractId(certificateCitation);
        var certificate = cache.fetchCertificate(certificateId);
        if (!certificate) {
            var source = repository.fetchCertificate(certificateId);
            if (source) {
                var certificateDocument = NotarizedDocument.fromString(source);
                validateCertificate(notary, certificateCitation, certificateDocument);
                certificate = bali.parser.parseDocument(certificateDocument.content);
                cache.storeCertificate(certificateId, certificate);
            } else {
                throw new Error('API: The certificate for the document does not exist:\n' + certificateId);
            }
        }
        if (!notary.documentIsValid(certificate, document)) {
            throw new Error('API: The following document is invalid:\n' + document);
        }
        try {
            document = notary.NotaryDocument.fromString(document.content);
            certificateCitation = notary.extractCitation(document.certificateReference);
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

var cache = {

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
            var key = this.certificates.keys().next().value;
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
            var key = this.documents.keys().next().value;
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
            var key = this.types.keys().next().value;
            this.types.delete(key);
        }
        this.types.set(typeId, type);
    }
};
