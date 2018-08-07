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
 * This library provides useful functions for accessing the Bali Cloud
 * Environment™. It provides a local filesystem based cloud implementation
 * that is useful for testing purposes only.
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
    this.tags = new Map();
    this.cache = new Map();
    return this;
}
BaliCloudAPI.prototype.constructor = BaliCloudAPI;
exports.BaliCloudAPI = BaliCloudAPI;


/**
 * This method retrieves a copy of the Bali document associated with the
 * specified citation from the Bali Cloud Environment™.
 * 
 * @param {SourceCitation} citation A citation of the document to be retrieved.
 * @returns {TreeNode} The corresponding document.
 */
BaliCloudAPI.prototype.retrieveDocument = function(citation) {
    var documentId = citation.tag + citation.version;
    console.log('retrieveDocument(' + documentId + ')');
    var document = fetchDocument(this, documentId);
    return document;
};


/**
 * This method checks out a new version of the Bali document associated
 * with the specified citation from the Bali Cloud Environment™. The version
 * of the document may then be modified and saved back to the Bali Cloud
 * Environment™ as a draft or as the new version..
 * 
 * @param {SourceCitation} citation A citation of the version of the document to be checked out.
 * @param {Version} newVersion The new version for the checked out document.
 * @returns {TreeNode} A new version of the corresponding document.
 */
BaliCloudAPI.prototype.checkoutDocument = function(citation, newVersion) {
    var currentId = citation.tag + citation.version;
    var newId = citation.tag + newVersion;
    console.log('checkoutDocument(' + currentId + ', ' + newId + ')');

    // make sure the current version of the document exists
    if (!this.repository.documentExists(currentId)) {
        throw new Error('CLOUD: The document being checked out does not exist: ' + currentId);
    }

    // make sure the new version of the document doesn't already exist
    if (this.cache[newId] || this.repository.documentExists(newId) || this.repository.draftExists(newId)) {
        throw new Error('CLOUD: The new version of the document being checked out already exists: ' + newId);
    }

    // fetch the document
    var document = fetchDocument(this, currentId);
    if (!document) {
        throw new Error('CLOUD: The document being checked does not exist: ' + currentId);
    }

    // store the current version as a draft of the new version
    document = language.removeSeal(document);  // remove the last seal
    this.repository.storeDraft(newId, document);

    return document;
};


/**
 * This method retrieves a copy of the Bali document draft associated with the
 * specified citation from the Bali Cloud Environment™.
 * 
 * @param {String} draftId The identifier of the document draft to be retrieved.
 * @returns {TreeNode} The corresponding document draft.
 */
BaliCloudAPI.prototype.retrieveDraft = function(draftId) {
    console.log('retrieveDraft(' + draftId + ')');
    var draft = fetchDraft(this, draftId);
    return draft;
};


/**
 * This method saves a draft of a Bali document associated with the specified
 * reference into the Bali Cloud Environment™. The version of the document may
 * then be modified and saved back to the Bali Cloud Environment™.
 * 
 * @param {URL} reference A reference to the document to be saved.
 * @param {TreeNode} draft The draft version of the document to be saved.
 */
BaliCloudAPI.prototype.saveDraft = function(reference, draft) {
    console.log('saveDraft(' + reference + ')');
    var documentId = resolveIdentifier(this, reference);
    if (this.repository.documentExists(documentId)) {
        throw new Error('CLOUD: The draft being saved is already committed: ' + documentId);
    }
    this.repository.storeDraft(documentId, draft);
};


/**
 * This method discards a draft of a Bali document associated with the specified
 * reference that has been saved into the Bali Cloud Environment™.
 * 
 * @param {URL} reference A reference to the draft to be discarded
 */
BaliCloudAPI.prototype.discardDraft = function(reference) {
    console.log('discardDraft(' + reference + ')');
    var documentId = resolveIdentifier(this, reference);
    this.repository.deleteDraft(documentId);
};


/**
 * This method commits a new version of a Bali document associated with the
 * specified reference to the Bali Cloud Environment™.
 * 
 * @param {URL} reference A reference to the document to be committed.
 * @param {TreeNode} document The new version of the document to be committed.
 */
BaliCloudAPI.prototype.commitDocument = function(reference, document) {
    console.log('commitDocument(' + reference + ', ' +  document + ')');
    var documentId = resolveIdentifier(this, reference);
    if (this.repository.documentExists(documentId)) {
        throw new Error('CLOUD: The document being saved is already committed: ' + documentId);
    }
    this.repository.storeDocument(documentId, document);
    if (this.repository.draftExists(documentId)) this.repository.deleteDraft(documentId);
};


/**
 * This method retrieves a message from the message queue associated with the
 * specified reference in the Bali Cloud Environment™. If there are no messages
 * currently on the queue then this method returns Template.NONE.
 * 
 * @param {URL} reference A reference to the message queue.
 * @returns {TreeNode} The received message.
 */
BaliCloudAPI.prototype.receiveMessage = function(reference) {
    console.log('receiveMessage(' + reference + ')');
    var documentId = resolveIdentifier(this, reference);
};


/**
 * This method sends a message to the message queue associated with the
 * specified reference in the Bali Cloud Environment™.
 * 
 * @param {URL} reference A reference to the message queue.
 * @param {TreeNode} message The message to be sent.
 */
BaliCloudAPI.prototype.sendMessage = function(reference, message) {
    console.log('sendMessage(' + reference + ', ' +  message + ')');
    var documentId = resolveIdentifier(this, reference);
};


/**
 * This method publishes an event to the Bali Cloud Environment™. Any task that
 * is interested in the event will be automatically notified.
 * 
 * @param {TreeNode} event The event to be published.
 */
BaliCloudAPI.prototype.publishEvent = function(event) {
    console.log('publishEvent(' + event + ')');
};


// PRIVATE FUNCTIONS

// These functions implement the document cache for the client side API.
// Since all documents are immutable, there are no cache consistency issues.
// The caching rules are as follows:
// 1) The cache is always checked before downloading a document.
// 2) A downloaded document is always validated before use.
// 3) A validated document is always cached locally.
// 4) The cache will delete the oldest document when it is full.

var MAX_CACHE_SIZE = 64;

function currentIdentifier(citation) {
    var tag = citation.tag.toString();
    var version = citation.version.toString();
    var documentId = tag + version;
    console.log('currentIdentifier(' + documentId + ')');

    var numbers = version.slice(1).split('.');
    var number = Number(numbers.pop());
    if (number > 1) {
        number--;
        numbers.push(number.toString());
    }
    return tag + 'v' + numbers.join();
}

function resolveIdentifier(client, reference) {
    console.log('resolveIdentifier(' + reference + ')');
    if (reference.protocol !== 'bali:') {
        throw new Error('CLOUD: The reference does not use the "bali:" protocol: ' + reference);
    }
    var source = reference.pathname.replace(/%23/, '#');  // decode '#' character
    var catalog = language.parseCatalog(source);
    var name = language.getStringForKey('name', catalog);
    var tag = language.getStringForKey('tag, catalog');
    var version = language.getStringForKey('version', catalog);

    if (!version) {
        throw new Error('CLOUD: The reference does not have a valid version string: ' + reference);
    }
    if (name && !/^(\/[A-Za-z0-9]+)+$/g.test(name)) {
        throw new Error('CLOUD: The reference has an invalid name: ' + name);
    }
    if (!tag) {
        // attempt to lookup the tag by name
        if (!name) {
            throw new Error('CLOUD: The reference does not include a name: ' + reference);
        }
        tag = client.tags.get(name);
        if (!tag) {
            throw new Error('CLOUD: The reference name does not have a corresponding tag: ' + name);
        }

    } else {
        // record the name of the documentId in the name registry
        if (name) {
            if (client.tags.get(name)) {
                throw new Error('CLOUD: The reference name already corresponds to another documentId: ' + name);
            }
            client.tags.set(name, tag);
        }
    }
    var documentId = tag + version;
    return documentId;
}

function fetchDraft(client, draftId) {
    console.log('fetchDraft(' + draftId + ')');

    var draft = client.cache[draftId];
    if (draft) {
        throw new Error('CLOUD: The following document already exists: ' + draftId);
    }
    var source = client.repository.fetchDocument(draftId);
    if (source) {
        // validate the draft
        draft = language.parseDocument(source);
        validateDocument(client, draftId, draft);
        // don't cache drafts since they are mutable
    }
    return draft;
}

function fetchDocument(client, documentId) {
    console.log('fetchDocument(' + documentId + ')');

    // check the cache
    var document = client.cache[documentId];

    // next check the repository if necessary
    if (!document) {
        var source = client.repository.fetchDocument(documentId);
        if (source) {
            // validate the document
            document = language.parseDocument(source);
            validateDocument(client, documentId, document);

            // cache the document
            if (client.cache.size > MAX_CACHE_SIZE) {
                // delete the first (oldest) cached document
                var key = client.cache.keys().next().value;
                client.cache.delete(key);
            }
            client.cache[documentId] = document;
        }
    }

    return document;
}

function validateDocument(client, documentId, document) {
    console.log('validateDocument(' + documentId + ')');
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
