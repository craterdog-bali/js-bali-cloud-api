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
var language = require('bali-language/BaliLanguage');
var notary = require('bali-digital-notary');


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
 * This method retrieves a read-only copy of the Bali document associated with the
 * specified citation from the Bali Environment™.
 * 
 * @param {SourceCitation} citation A citation for the document to be retrieved.
 * @returns {Document} The associated document.
 */
BaliCloudAPI.prototype.retrieveDocument = function(citation) {
    var documentId = citation.tag + citation.version;
    console.log('retrieveDocument(' + documentId + ')');
    var document = fetchDocument(this, documentId);
    return document;
};


/**
 * This method checks out a new version of the Bali document associated
 * with the specified citation from the Bali Environment™. The new version
 * of the document may then be modified and saved back to the Bali
 * Environment™ as a draft or committed as a new version.
 * 
 * @param {SourceCitation} citation A citation for the version of the document being checked out.
 * @param {String} newVersion The new version for the checked out document.
 * @returns {Document} A new version of the associated document.
 */
BaliCloudAPI.prototype.checkoutDocument = function(citation, newVersion) {
    var tag = citation.tag;
    var currentVersion = citation.version;
    var currentId = tag + currentVersion;
    var newId = tag + newVersion;
    console.log('checkoutDocument(' + currentId + ', ' + newId + ')');

    // validate the new version number
    if (!validNextVersion(currentVersion, newVersion)) {
        throw new Error('CLOUD: The new version (' + newVersion + ') is not a valid next version for: ' + currentVersion);
    }

    // make sure the new version of the document doesn't already exist
    if (isCached(newId) || this.repository.documentExists(newId) || this.repository.draftExists(newId)) {
        throw new Error('CLOUD: The new version of the document being checked out already exists: ' + newId);
    }

    // fetch the document
    var document = fetchDocument(this, currentId);
    if (!document) {
        throw new Error('CLOUD: The document being checked does not exist: ' + currentId);
    }

    // store the current version as a draft of the new version
    var draft = language.removeSeal(document);  // remove the last seal
    language.setPreviousCitation(draft, citation);  // add previous version citation
    this.repository.storeDraft(newId, draft);

    return draft;
};


/**
 * This method saves a draft of a Bali document associated with the specified
 * identifier into the Bali Environment™.
 * 
 * @param {String} draftId The identifier for the Bali document draft to be saved.
 * @param {Document} draft The draft of the document to be saved.
 */
BaliCloudAPI.prototype.saveDraft = function(draftId, draft) {
    console.log('saveDraft(' + draftId + ')');
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
 * @param {String} draftId The identifier of the document draft to be retrieved.
 * @returns {Document} The associated document draft.
 */
BaliCloudAPI.prototype.retrieveDraft = function(draftId) {
    console.log('retrieveDraft(' + draftId + ')');
    var draft;
    if (isCached(draftId)) {
        throw new Error('CLOUD: The following committed document already exists: ' + draftId);
    }
    var source = this.repository.fetchDraft(draftId);
    if (source) {
        // validate the draft
        draft = language.parseDocument(source);
        validateDocument(this, draftId, draft);
        // don't cache drafts since they are mutable
    }
    return draft;
};


/**
 * This method discards any draft of the Bali document associated with the
 * specified identifier that has been saved into the Bali Environment™.
 * 
 * @param {String} draftId The identifier of the document draft to be discarded.
 */
BaliCloudAPI.prototype.discardDraft = function(draftId) {
    console.log('discardDraft(' + draftId + ')');
    this.repository.deleteDraft(draftId);
};


/**
 * This method commits a draft of a Bali document as a new version associated with the
 * specified identifier to the Bali Environment™.
 * 
 * @param {String} draftId The identifier of the document draft to be committed.
 * @param {Document} draft The draft of the new version of the document to be committed.
 */
BaliCloudAPI.prototype.commitDraft = function(draftId, draft) {
    console.log('commitDraft(' + draftId + ', ' +  draft + ')');

    // store the new version of the document in the repository
    if (this.repository.documentExists(draftId)) {
        throw new Error('CLOUD: The draft being saved is already committed: ' + draftId);
    }
    this.notaryKey.notarizeDocument(draft);
    this.repository.storeDocument(draftId, draft);

    // delete the stored draft if one exists from the repository
    if (this.repository.draftExists(draftId)) this.repository.deleteDraft(draftId);
};


var SEND_QUEUE_ID = '#JXT095QY01HBLHPAW04ZR5WSH41MWG4H';
var EVENT_QUEUE_ID = '#3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43';


/**
 * This method sends a message to a component in the Bali Environment™. It causes
 * a new Bali Virtual Machine™ to be created to handle the processing of the message.
 * 
 * @param {SourceCitation} citation A citation for the document that is to process
 * the message.
 * @param {Document} message The message to be sent.
 */
BaliCloudAPI.prototype.sendMessage = function(citation, message) {
    var documentId = citation.tag + citation.version;
    console.log('sendMessage(' + documentId + ', ' +  message + ')');

    // add the target citation
    language.setAttribute(message, '$target', citation.toString());

    // store the message on the queue
    queueMessage(this, SEND_QUEUE_ID, message);
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
    console.log('queueMessage(' + queueId + ', ' +  message + ')');

    // store the message on the queue
    queueMessage(this, queueId, message);
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
    console.log('receiveMessage(' + queueId + ')');
    var message;
    var source = this.repository.dequeueMessage(queueId);
    if (source) {
        // validate the document
        message = language.parseDocument(source);
        var messageId = language.getStringForKey('$tag');
        validateDocument(this, messageId, message);
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
    console.log('publishEvent(' + event + ')');

    // store the message on the queue
    queueMessage(this, EVENT_QUEUE_ID, event);
};


// PRIVATE HELPER FUNCTIONS

function queueMessage(client, queueId, message) {
    var messageId = language.tag();
    language.setAttribute(message, '$tag', messageId);
    client.notaryKey.notarizeDocument(message);
    client.repository.queueMessage(queueId, messageId, message);
}


function validNextVersion(currentVersion, nextVersion) {
    // extract the version numbers
    var currentNumbers = currentVersion.slice(1).split('.');
    var nextNumbers = nextVersion.slice(1).split('.');

    // walk the lists looking for the first different version number
    var index = 0;
    while (index < currentNumbers.length && index < nextNumbers.length) {
        var currentNumber = currentNumbers[index];
        var nextNumber = nextNumbers[index];
        if (currentNumber !== nextNumber) {
            // the final next version number must be one more than the corresponding current version number
            return (nextNumber === currentNumber + 1 && nextNumbers.length === index + 1);
        }
        index++;
    }
    // the current and next versions are the same so invalid
    return false;
}


function validateDocument(client, documentId, document) {
    var certificate;
    var seal = language.getSeal(document);
    while (seal) {
        document = language.removeSeal(document);
        var citation = language.getCitation(seal);
        var certificateId = citation.tag + citation.version;
        if (certificateId !== documentId) {
            certificate = new notary.NotaryCertificate(fetchDocument(client, certificateId));
        } else {
            certificate = new notary.NotaryCertificate(document);  // the document is self-signed
        }
        if (!certificate.documentIsValid(document)) {
            throw new Error('CLOUD: The following document is invalid: ' + documentId + '\n' + document);
        }
    }
}


// This defines a document cache for the client side API.
// Since all documents are immutable, there are no cache consistency issues.
// The caching rules are as follows:
// 1) The cache is always checked before downloading a document.
// 2) A downloaded document is always validated before use.
// 3) A validated document is always cached locally.
// 4) The cache will delete the oldest document when it is full.

var MAX_CACHE_SIZE = 64;
var CACHE = new Map();


function isCached(documentId) {
    return CACHE.has(documentId);
}


function fetchDocument(client, documentId) {
    // check the cache
    var document = CACHE.get(documentId);

    // next check the repository if necessary
    if (!document) {
        var source = client.repository.fetchDocument(documentId);
        if (source) {
            // validate the document
            document = language.parseDocument(source);
            validateDocument(client, documentId, document);

            // cache the document
            if (CACHE.size > MAX_CACHE_SIZE) {
                // delete the first (oldest) cached document
                var key = CACHE.keys().next().value;
                CACHE.delete(key);
            }
            CACHE.set(documentId, document);
        }
    }

    return document;
}
