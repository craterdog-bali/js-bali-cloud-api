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
 * This library provides useful functions for accessing the Bali Environment™.
 */
var bali = require('bali-language/BaliLanguage');
var notary = require('bali-digital-notary/BaliNotary');


/**
 * This constructor creates a new cloud API that can be accessed using
 * the specified notary key.
 * 
 * @param {NotaryKey} notaryKey The key to be used to notarize documents. 
 * @param {Repository} repository The underlying document repository to be used.
 * @returns {BaliCloudAPI} The new cloud API.
 */
function BaliCloudAPI(notaryKey, repository) {
    this.notaryKey = notaryKey;
    this.repository = repository;
    return this;
}
BaliCloudAPI.prototype.constructor = BaliCloudAPI;
exports.BaliCloudAPI = BaliCloudAPI;


/**
 * This method publishes a read-only copy of a Bali certificate to the Bali
 * Environment™.
 * 
 * @param {Document} certificate The Bali certificate to be published.
 */
BaliCloudAPI.prototype.publishCertificate = function(certificate) {
    var tag = bali.getStringForKey(certificate, '$tag');
    var version = bali.getStringForKey(certificate, '$version');
    var certificateId = tag.slice(1) + version;
    console.log('        publishCertificate(' + certificateId + ')');
    // store the certificate in the repository
    if (this.repository.certificateExists(certificateId)) {
        throw new Error('CLOUD: The certificate being saved is already published: ' + certificateId);
    }
    validateCertificate(certificateId, certificate);
    this.repository.storeCertificate(certificateId, certificate);
    CERTIFICATE_CACHE.set(certificateId, certificate);
};


/**
 * This method retrieves a read-only copy of the Bali certificate associated with the
 * specified citation from the Bali Environment™.
 * 
 * @param {DocumentCitation} citation A citation for the certificate to be retrieved.
 * @returns {Document} The associated certificate.
 */
BaliCloudAPI.prototype.retrieveCertificate = function(citation) {
    var tag = notary.citationTag(citation);
    var version = notary.citationVersion(citation);
    var certificateId = tag.slice(1) + version;
    console.log('        retrieveCertificate(' + certificateId + ')');
    var certificate = fetchCertificate(this.repository, certificateId);
    return certificate;
};


/**
 * This method checks out a new version of the Bali document associated
 * with the specified citation from the Bali Environment™. The new version
 * of the document may then be modified and saved back to the Bali
 * Environment™ as a draft or committed as a new version.
 * 
 * @param {DocumentCitation} citation A citation for the version of the document being checked out.
 * @param {String} newVersion The new version for the checked out document.
 * @returns {Document} A new version of the associated document.
 */
BaliCloudAPI.prototype.checkoutDocument = function(citation, newVersion) {
    var tag = notary.citationTag(citation);
    var currentVersion = notary.citationVersion(citation);
    var currentId = tag.slice(1) + currentVersion;
    var newId = tag.slice(1) + newVersion;
    console.log('        checkoutDocument(' + currentId + ', ' + newId + ')');

    // validate the new version number
    if (!validNextVersion(currentVersion, newVersion)) {
        throw new Error('CLOUD: The new version (' + newVersion + ') is not a valid next version for: ' + currentVersion);
    }

    // make sure the new version of the document doesn't already exist
    if (DOCUMENT_CACHE.has(newId) || this.repository.documentExists(newId) || this.repository.draftExists(newId)) {
        throw new Error('CLOUD: The new version of the document being checked out already exists: ' + newId);
    }

    // fetch the document
    var document = fetchDocument(this.repository, currentId);
    if (!document) {
        throw new Error('CLOUD: The document being checked does not exist: ' + currentId);
    }

    // store the current version as a draft of the new version
    var draft = bali.removeSeal(document);  // remove the last seal
    bali.setPreviousCitation(draft, citation);  // add previous version citation
    this.repository.storeDraft(newId, draft);

    return draft;
};


/**
 * This method saves a draft of a Bali document associated with the specified
 * identifier into the Bali Environment™.
 * 
 * @param {String} tag The unique tag for the Bali document draft to be saved.
 * @param {String} version The version string for the Bali document draft to be saved.
 * @param {Document} draft The draft of the document to be saved.
 */
BaliCloudAPI.prototype.saveDraft = function(tag, version, draft) {
    var draftId = tag.slice(1) + version;
    console.log('        saveDraft(' + draftId + ')');
    if (this.repository.documentExists(draftId)) {
        throw new Error('CLOUD: The draft being saved is already committed: ' + draftId);
    }
    this.repository.storeDraft(draftId, draft);
};


/**
 * This method retrieves a copy of the Bali document draft associated with the
 * specified identifier from the Bali Environment™. This draft may then be modified
 * and saved or committed to the Bali Environment™.
 * 
 * @param {String} tag The unique tag for the Bali document draft to be saved.
 * @param {String} version The version string for the Bali document draft to be saved.
 * @returns {Document} The associated document draft.
 */
BaliCloudAPI.prototype.retrieveDraft = function(tag, version) {
    var draftId = tag.slice(1) + version;
    console.log('        retrieveDraft(' + draftId + ')');
    var draft;
    if (DOCUMENT_CACHE.has(draftId)) {
        throw new Error('CLOUD: The following committed document already exists: ' + draftId);
    }
    var source = this.repository.fetchDraft(draftId);
    if (source) {
        // validate the draft
        draft = bali.parseDocument(source);
        validateDocument(this.repository, draftId, draft);
        // don't cache drafts since they are mutable
    }
    return draft;
};


/**
 * This method discards any draft of the Bali document associated with the
 * specified identifier that has been saved into the Bali Environment™.
 * 
 * @param {String} tag The unique tag for the Bali document draft to be saved.
 * @param {String} version The version string for the Bali document draft to be saved.
 */
BaliCloudAPI.prototype.discardDraft = function(tag, version) {
    var draftId = tag.slice(1) + version;
    console.log('        discardDraft(' + draftId + ')');
    this.repository.deleteDraft(draftId);
};


/**
 * This method commits a draft of a Bali document as a new version associated with the
 * specified identifier to the Bali Environment™.
 * 
 * @param {String} tag The unique tag for the Bali document to be saved.
 * @param {String} version The version string for the Bali document to be saved.
 * @param {Document} document The draft of the new version of the document to be committed.
 * @returns {DocumentCitation} A citation to the commited version of the document.
 */
BaliCloudAPI.prototype.commitDocument = function(tag, version, document) {
    var documentId = tag.slice(1) + version;
    console.log('        commitDocument(' + documentId + ')');

    // store the new version of the document in the repository
    if (this.repository.documentExists(documentId)) {
        throw new Error('CLOUD: The document being saved is already committed: ' + documentId);
    }
    var citation = notary.notarizeDocument(this.notaryKey, tag, version, document);
    validateDocument(this.repository, documentId, document);
    this.repository.storeDocument(documentId, document);
    DOCUMENT_CACHE.set(documentId, document);

    // delete the stored draft if one exists from the repository
    if (this.repository.draftExists(documentId)) this.repository.deleteDraft(documentId);

    return citation;
};


/**
 * This method retrieves a read-only copy of the Bali document associated with the
 * specified citation from the Bali Environment™.
 * 
 * @param {DocumentCitation} citation A citation for the document to be retrieved.
 * @returns {Document} The associated document.
 */
BaliCloudAPI.prototype.retrieveDocument = function(citation) {
    var tag = notary.citationTag(citation);
    var version = notary.citationVersion(citation);
    var documentId = tag.slice(1) + version;
    console.log('        retrieveDocument(' + documentId + ')');
    var document = fetchDocument(this.repository, documentId);
    return document;
};


var SEND_QUEUE_ID = '#JXT095QY01HBLHPAW04ZR5WSH41MWG4H';
var EVENT_QUEUE_ID = '#3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43';


/**
 * This method sends a message to a component in the Bali Environment™. It causes
 * a new Bali Virtual Machine™ to be created to handle the processing of the message.
 * 
 * @param {DocumentCitation} target A citation for the target document that is to process
 * the message.
 * @param {Document} message The message to be sent.
 */
BaliCloudAPI.prototype.sendMessage = function(target, message) {
    var targetId = target.tag.slice(1) + target.version;
    console.log('        sendMessage(' + targetId + ', ' +  message + ')');
    bali.setAttribute(message, '$target', target.toString());
    var messageId = bali.tag();
    bali.setAttribute(message, '$tag', messageId);
    notary.notarizeDocument(this.notaryKey, messageId, 'v1', message);
    this.repository.queueMessage(SEND_QUEUE_ID, messageId, message);
};


/**
 * This method queues a message on the message queue associated with the
 * specified identifier in the Bali Environment™. If the queue does not
 * exist it is created.
 * 
 * @param {String} queueId The identifier of the queue on which to place the message.
 * @param {Document} message The message to be queued.
 */
BaliCloudAPI.prototype.queueMessage = function(queueId, message) {
    console.log('        queueMessage(' + queueId + ', ' +  message + ')');
    var messageId = bali.tag();
    bali.setAttribute(message, '$tag', messageId);
    notary.notarizeDocument(this.notaryKey, messageId, 'v1', message);
    this.repository.queueMessage(queueId, messageId, message);
};


/**
 * This method retrieves a message from the message queue associated with the
 * specified reference in the Bali Environment™. If there are no messages
 * currently on the queue then this method returns <code>undefined</code>.
 * 
 * @param {String} queueId The identifier of the queue from which to retrieve the message.
 * @returns {Document} The retrieved message or <code>undefined</code> if the queue is empty.
 */
BaliCloudAPI.prototype.receiveMessage = function(queueId) {
    console.log('        receiveMessage(' + queueId + ')');
    var message;
    var source = this.repository.dequeueMessage(queueId);
    if (source) {
        // validate the document
        message = bali.parseDocument(source);
        var messageId = bali.getStringForKey(message, '$tag');
        validateDocument(this.repository, messageId, message);
    }
    return message;
};


/**
 * This method publishes an event to the Bali Environment™. Any task that
 * is interested in the event will be automatically notified.
 * 
 * @param {Document} event The event to be published.
 */
BaliCloudAPI.prototype.publishEvent = function(event) {
    console.log('        publishEvent(' + event + ')');

    // store the message on the queue
    queueMessage(this, EVENT_QUEUE_ID, event);
};


// PRIVATE HELPER FUNCTIONS

function validNextVersion(currentVersion, nextVersion) {
    // extract the version numbers
    var currentNumbers = currentVersion.slice(1).split('.');
    var nextNumbers = nextVersion.slice(1).split('.');

    // walk the lists looking for the first different version number
    var index = 0;
    while (index < currentNumbers.length && index < nextNumbers.length) {
        var currentNumber = Number(currentNumbers[index]);
        var nextNumber = Number(nextNumbers[index]);
        if (currentNumber === nextNumber) {
            index++;
            continue;
        }
        // the final next version number must be one more than the corresponding current version number
        return (nextNumber === currentNumber + 1 && nextNumbers.length === index + 1);
    }
    // check for a new subversion level of one
    return (nextNumbers.length === index + 1 && nextNumbers[index] === '1');
}


function fetchCertificate(repository, certificateId) {
    // check the cache
    var certificate = CERTIFICATE_CACHE.get(certificateId);

    // next check the repository if necessary
    if (!certificate) {
        var source = repository.fetchCertificate(certificateId);
        if (source) {
            // validate the certificate
            certificate = bali.parseDocument(source);
            validateCertificate(certificateId, certificate);

            // cache the certificate
            if (CERTIFICATE_CACHE.size > MAX_CACHE_SIZE) {
                // delete the first (oldest) cached certificate
                var key = CERTIFICATE_CACHE.keys().next().value;
                CERTIFICATE_CACHE.delete(key);
            }
            CERTIFICATE_CACHE.set(certificateId, certificate);
        }
    }

    return certificate;
}


function validateCertificate(certificateId, certificate) {
    console.log('        validateCertificate(' + certificateId + ')');
    var certificateTag = bali.getStringForKey(certificate, '$tag');
    var certificateVersion = bali.getStringForKey(certificate, '$version');
    if (certificateId !== certificateTag.slice(1) + certificateVersion) {
        throw new Error('CLOUD: The following certificate has an invalid certificateId: ' + certificateId + '\n' + certificate);
    }
    var seal = bali.getSeal(certificate);
    var citation = bali.getCitation(seal).toString();
    var citationTag = notary.citationTag(citation);
    var citationVersion = notary.citationVersion(citation);
    var citationId = citationTag.slice(1) + citationVersion;
    if (citationId !== certificateId) {
        throw new Error('CLOUD: The following certificate has an invalid citation: ' + certificateId + '\n' + certificate);
    }
    if (!notary.documentIsValid(certificate, certificate)) {
        throw new Error('CLOUD: The following certificate is invalid: ' + certificateId + '\n' + certificate);
    }
}


function fetchDocument(repository, documentId) {
    // check the cache
    var document = DOCUMENT_CACHE.get(documentId);

    // next check the repository if necessary
    if (!document) {
        var source = repository.fetchDocument(documentId);
        if (source) {
            // validate the document
            document = bali.parseDocument(source);
            validateDocument(repository, documentId, document);

            // cache the document
            if (DOCUMENT_CACHE.size > MAX_CACHE_SIZE) {
                // delete the first (oldest) cached document
                var key = DOCUMENT_CACHE.keys().next().value;
                DOCUMENT_CACHE.delete(key);
            }
            DOCUMENT_CACHE.set(documentId, document);
        }
    }

    return document;
}


function validateDocument(repository, documentId, document) {
    console.log('        validateDocument(' + documentId + ')');
    var seal = bali.getSeal(document);
    while (seal) {
        var citation = bali.getCitation(seal).toString();
        var tag = notary.citationTag(citation);
        var version = notary.citationVersion(citation);
        var certificateId = tag.slice(1) + version;
        var certificate = fetchCertificate(repository, certificateId);
        if (!notary.documentIsValid(certificate, document)) {
            throw new Error('CLOUD: The following document is invalid: ' + documentId + '\n' + document);
        }
        document = bali.removeSeal(document);
        seal = bali.getSeal(document);
    }
}


// This defines the caches for the client side API.
// Since all documents are immutable, there are no cache consistency issues.
// The caching rules are as follows:
// 1) The cache is always checked before downloading a document.
// 2) A downloaded document is always validated before use.
// 3) A validated document is always cached locally.
// 4) The cache will delete the oldest document when it is full.

var MAX_CACHE_SIZE = 64;
var CERTIFICATE_CACHE = new Map();
var DOCUMENT_CACHE = new Map();
