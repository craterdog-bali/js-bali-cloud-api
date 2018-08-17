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
var bali = require('bali-document-notation/BaliDocuments');
var notary = require('bali-digital-notary/BaliNotary');
var config = require('os').homedir() + '/.bali/';
var fs = require('fs');


/**
 * This constructor creates a new cloud API that can be accessed using
 * the specified notary key.
 * 
 * @param {NotaryKey} notaryKey The key to be used to notarize documents. 
 * @param {Repository} repository The underlying document repository to be used.
 * @returns {BaliAPI} The new cloud API.
 */
function BaliAPI(notaryKey, repository) {
    this.notaryKey = notaryKey;
    this.repository = repository;
    return this;
}
BaliAPI.prototype.constructor = BaliAPI;
exports.BaliAPI = BaliAPI;


BaliAPI.loadClient = function(account, repository) {
    // validate the arguments
    if (!account) account = 'account';
    if (!repository) repository = new CloudRepository();

    // create the config directory if necessary
    if (!fs.existsSync(config)) fs.mkdirSync(config, 448);  // drwx------ permissions
    var configFile = config + account + '.bali';

    // gather notary key information
    var notaryKey;
    var certificate;
    var exists;
    try {
        exists = fs.existsSync(configFile);
        if (exists) {
            // read in the notary key information for the account
            var source = fs.readFileSync(configFile).toString();
            var document = bali.parseDocument(source);
            notaryKey = notary.notaryKey(document);
        } else {
            // generate a new notary key for the account and write it out
            var keypair = notary.generateKeys('v1');
            notaryKey = keypair.notaryKey;
            certificate = keypair.certificate;
            fs.writeFileSync(configFile, notaryKey.toString(), {mode: 384});  // -rw------- permissions
        }
    } catch (e) {
        throw new Error('API: The filesystem is not currently accessible:\n' + e);
    }

    // construct the client
    var client = new BaliAPI(notaryKey, repository);

    // publish the notary certificate if necessary
    if (!exists) {
            validateCertificate(certificate);
            var tag = bali.getStringForKey(certificate, '$tag');
            var version = bali.getStringForKey(certificate, '$version');
            try {
                if (!repository.certificateExists(tag, version)) {
                    repository.storeCertificate(tag, version, certificate);
                }
            } catch (e) {
                throw new Error('API: The repository is not currently accessible:\n' + e);
            }
            CERTIFICATE_CACHE.set(tag + version, certificate);
    }

    return client;
};


/**
 * This method retrieves a read-only copy of the Bali certificate associated with the
 * specified citation from the Bali Environment™.
 * 
 * @param {String} citation A citation for the certificate to be retrieved.
 * @returns {Document} The associated certificate.
 */
BaliAPI.prototype.retrieveCertificate = function(citation) {
    var tag = notary.getTag(citation);
    var version = notary.getVersion(citation);
    var certificate = fetchCertificate(this.repository, tag, version);
    return certificate;
};


/**
 * This method checks out a new version of the Bali document associated
 * with the specified citation from the Bali Environment™. The new version
 * of the document may then be modified and saved back to the Bali
 * Environment™ as a draft or committed as a new version.
 * 
 * @param {String} citation A citation for the version of the document being checked out.
 * @param {String} newVersion The new version for the checked out document.
 * @returns {Document} A new version of the associated document.
 */
BaliAPI.prototype.checkoutDocument = function(citation, newVersion) {
    var tag = notary.getTag(citation);
    var currentVersion = notary.getVersion(citation);

    // validate the new version number
    if (!validNextVersion(currentVersion, newVersion)) {
        throw new Error('API: The new version (' + newVersion + ') is not a valid next version for: ' + currentVersion);
    }

    // make sure the new version of the document doesn't already exist
    if (DOCUMENT_CACHE.has(tag + newVersion) || this.repository.documentExists(tag, newVersion) || this.repository.draftExists(tag, newVersion)) {
        throw new Error('API: The new version of the document being checked out already exists: ' + tag + newVersion);
    }

    // fetch the document
    var document = fetchDocument(this.repository, tag, currentVersion);
    if (!document) {
        throw new Error('API: The document being checked does not exist: ' + tag + currentVersion);
    }

    // store a copy of the current version as a draft of the new version
    var draft = bali.draftDocument(document);
    bali.setPreviousCitation(draft, citation);  // add previous version citation
    this.repository.storeDraft(tag, newVersion, draft);

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
BaliAPI.prototype.saveDraft = function(tag, version, draft) {
    if (DOCUMENT_CACHE.has(tag + version) || this.repository.documentExists(tag, version)) {
        throw new Error('API: The draft being saved is already committed: ' + tag + version);
    }
    this.repository.storeDraft(tag, version, draft);
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
BaliAPI.prototype.retrieveDraft = function(tag, version) {
    var draft;
    var source = this.repository.fetchDraft(tag, version);
    if (source) {
        // validate the draft
        draft = bali.parseDocument(source);
        validateDocument(this.repository, draft);
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
BaliAPI.prototype.discardDraft = function(tag, version) {
    this.repository.deleteDraft(tag, version);
};


/**
 * This method commits a draft of a Bali document as a new version associated with the
 * specified identifier to the Bali Environment™.
 * 
 * @param {String} tag The unique tag for the Bali document to be saved.
 * @param {String} version The version string for the Bali document to be saved.
 * @param {Document} document The draft of the new version of the document to be committed.
 * @returns {String} A citation to the commited version of the document.
 */
BaliAPI.prototype.commitDocument = function(tag, version, document) {
    // store the new version of the document in the repository
    if (this.repository.documentExists(tag, version)) {
        throw new Error('API: The document being saved is already committed: ' + tag + version);
    }
    var citation = notary.notarizeDocument(this.notaryKey, tag, version, document);
    validateDocument(this.repository, document);
    this.repository.storeDocument(tag, version, document);
    DOCUMENT_CACHE.set(tag + version, document);

    // delete the stored draft if one exists from the repository
    if (this.repository.draftExists(tag, version)) this.repository.deleteDraft(tag, version);

    return citation;
};


/**
 * This method retrieves a read-only copy of the Bali document associated with the
 * specified citation from the Bali Environment™.
 * 
 * @param {String} citation A citation for the document to be retrieved.
 * @returns {Document} The associated document.
 */
BaliAPI.prototype.retrieveDocument = function(citation) {
    var tag = notary.getTag(citation);
    var version = notary.getVersion(citation);
    var document = fetchDocument(this.repository, tag, version);
    return document;
};


var SEND_QUEUE_ID = 'JXT095QY01HBLHPAW04ZR5WSH41MWG4H';
var EVENT_QUEUE_ID = '3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43';


/**
 * This method sends a message to a component in the Bali Environment™. It causes
 * a new Bali Virtual Machine™ to be created to handle the processing of the message.
 * 
 * @param {String} target A citation for the target document that is to process
 * the message.
 * @param {Document} message The message to be sent.
 */
BaliAPI.prototype.sendMessage = function(target, message) {
    bali.setValueForKey(message, '$target', bali.parseElement(target));
    var tag = bali.tag();
    bali.setValueForKey(message, '$tag', tag);
    notary.notarizeDocument(this.notaryKey, tag, 'v1', message);
    this.repository.queueMessage(SEND_QUEUE_ID, tag, message);
};


/**
 * This method queues a message on the message queue associated with the
 * specified identifier in the Bali Environment™. If the queue does not
 * exist it is created.
 * 
 * @param {String} queue The identifier of the queue on which to place the message.
 * @param {Document} message The message to be queued.
 */
BaliAPI.prototype.queueMessage = function(queue, message) {
    var tag = bali.tag();
    bali.setValueForKey(message, '$tag', tag);
    notary.notarizeDocument(this.notaryKey, tag, 'v1', message);
    this.repository.queueMessage(queue, tag, message);
};


/**
 * This method retrieves a message from the message queue associated with the
 * specified reference in the Bali Environment™. If there are no messages
 * currently on the queue then this method returns <code>undefined</code>.
 * 
 * @param {String} queue The identifier of the queue from which to retrieve the message.
 * @returns {Document} The retrieved message or <code>undefined</code> if the queue is empty.
 */
BaliAPI.prototype.receiveMessage = function(queue) {
    var message;
    var source = this.repository.dequeueMessage(queue);
    if (source) {
        // validate the document
        message = bali.parseDocument(source);
        validateDocument(this.repository, message);
    }
    return message;
};


/**
 * This method publishes an event to the Bali Environment™. Any task that
 * is interested in the event will be automatically notified.
 * 
 * @param {Document} event The event to be published.
 */
BaliAPI.prototype.publishEvent = function(event) {
    var tag = bali.tag();
    bali.setValueForKey(event, '$tag', tag);
    notary.notarizeDocument(this.notaryKey, tag, 'v1', event);
    this.repository.queueMessage(EVENT_QUEUE_ID, tag, event);
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


function fetchCertificate(repository, tag, version) {
    // check the cache
    var certificate = CERTIFICATE_CACHE.get(tag + version);

    // next check the repository if necessary
    if (!certificate) {
        var source = repository.fetchCertificate(tag, version);
        if (source) {
            // validate the certificate
            certificate = bali.parseDocument(source);
            validateCertificate(certificate);

            // cache the certificate
            if (CERTIFICATE_CACHE.size > MAX_CACHE_SIZE) {
                // delete the first (oldest) cached certificate
                var key = CERTIFICATE_CACHE.keys().next().value;
                CERTIFICATE_CACHE.delete(key);
            }
            CERTIFICATE_CACHE.set(tag + version, certificate);
        }
    }

    return certificate;
}


function validateCertificate(certificate) {
    var certificateTag = bali.getStringForKey(certificate, '$tag');
    var certificateVersion = bali.getStringForKey(certificate, '$version');
    var seal = bali.getSeal(certificate);
    var citation = bali.getCitation(seal);
    var citationTag = notary.getTag(citation);
    var citationVersion = notary.getVersion(citation);
    if (certificateTag !== citationTag || certificateVersion !== citationVersion) {
        throw new Error('API: The following certificate has an invalid citation:\n' + certificate);
    }
    if (!notary.documentIsValid(certificate, certificate)) {
        throw new Error('API: The following certificate is invalid:\n' + certificate);
    }
}


function fetchDocument(repository, tag, version) {
    // check the cache
    var document = DOCUMENT_CACHE.get(tag + version);

    // next check the repository if necessary
    if (!document) {
        var source = repository.fetchDocument(tag, version);
        if (source) {
            // validate the document
            document = bali.parseDocument(source);
            validateDocument(repository, document);

            // cache the document
            if (DOCUMENT_CACHE.size > MAX_CACHE_SIZE) {
                // delete the first (oldest) cached document
                var key = DOCUMENT_CACHE.keys().next().value;
                DOCUMENT_CACHE.delete(key);
            }
            DOCUMENT_CACHE.set(tag + version, document);
        }
    }

    return document;
}


function validateDocument(repository, document) {
    var seal = bali.getSeal(document);
    while (seal) {
        var citation = bali.getCitation(seal);
        var tag = notary.getTag(citation);
        var version = notary.getVersion(citation);
        var certificate = fetchCertificate(repository, tag, version);
        if (!notary.documentIsValid(certificate, document)) {
            throw new Error('API: The following document is invalid:\n' + document);
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
