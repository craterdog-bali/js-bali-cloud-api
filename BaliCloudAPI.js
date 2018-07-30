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

    // check the cache
    var document = this.cache[documentId];

    // next check the repository if necessary
    if (!document) {
        var source = this.repository.fetchDocument(documentId);
        if (source) {
            // validate and cache the document
            document = language.parseDocument(source);
            validateDocument(this, documentId, document);
            this.cache[documentId] = document;
        }
    }

    return document;
};


/**
 * This method checks out a new version of the Bali document associated
 * with the specified citation from the Bali Cloud Environment™. The version
 * of the document may then be modified and saved back to the Bali Cloud
 * Environment™ as a draft or as the new version..
 * 
 * @param {SourceCitation} citation A citation of the document to be checked out.
 * @returns {TreeNode} A new version of the corresponding document.
 */
BaliCloudAPI.prototype.checkoutDocument = function(documentId) {
    console.log('checkoutDocument(' + documentId + ')');

    // make sure the new version of the document doesn't already exist
    if (this.repository.documentExists(documentId) || this.repository.draftExists(documentId)) {
        throw new Error('CLOUD: The document being checked out already exists: ' + documentId);
    }

    // fetch the current version of the document
    var currentId = currentVersion(documentId);

    // check the cache
    var document = this.cache[currentId];

    // next check the repository if necessary
    if (!document) {
        var source = this.repository.fetchDocument(currentId);
        if (source) {
            // validate and cache the document
            document = language.parseDocument(source);
            validateDocument(this, documentId, document);
            this.cache[documentId] = document;
        }
    }
    if (!document) {
        throw new Error('CLOUD: The document being checked does not exist: ' + currentId);
    }
    document = language.removeSeal(document);  // remove the last seal

    // store the current version as a draft of the new version
    this.repository.storeDraft(documentId, document);

    return document;
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
    if (documentExists(this, documentId)) {
        throw new Error('CLOUD: The draft being saved is already committed: ' + documentId);
    }
    storeDraft(this, documentId, draft);
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
    deleteDraft(this, documentId);
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
    if (documentExists(this, documentId)) {
        throw new Error('CLOUD: The document being saved is already committed: ' + documentId);
    }
    storeDocument(this, documentId, document);
    if (draftExists(this, documentId)) deleteDraft(this, documentId);
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

function currentVersion(documentId) {
    console.log('currentVersion(' + documentId + ')');
    // TODO: how to handle varying tag lengths?
    var tag = documentId.slice(0, 32);
    var version = documentId.slice(33);
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

function fetchDraft(client, documentId) {
    console.log('fetchDraft(' + documentId + ')');
    var draft;
    try {
        var source = fs.readFileSync(client.drafts + documentId);
        var document = language.parseDocument(source);
        validateDocument(client, documentId, document);
        // don't cache drafts since they are mutable
        draft = language.getBody(document);  // strip off the last seal
    } catch (e) {
        // ignore it and return undefined
    }
    return draft;
}

function storeDraft(client, documentId, draft) {
    console.log('storeDraft(' + documentId + ')');
    client.notaryKey.notarizeDocument(draft);
    try {
        fs.writeFileSync(client.drafts + documentId, draft, 0o600);
    } catch (e) {
        throw new Error('CLOUD: The following draft could not be stored in the filesystem: ' + documentId + '\n' + draft);
    }
}

function deleteDraft(client, documentId) {
    console.log('deleteDraft(' + documentId + ')');
    try {
        fs.unlinkSync(client.drafts + documentId);
    } catch (e) {
        throw new Error('CLOUD: The following draft could not be deleted from the filesystem: ' + documentId);
    }
}

function documentExists(client, documentId) {
    console.log('documentExists(' + documentId + ')');
    try {
        return fs.existsSync(client.documents + documentId);
    } catch (e) {
        throw new Error('CLOUD: The filesystem is not currently accessible.');
    }
}

function fetchDocument(client, citation) {
    var documentId = citation.tag + citation.version;
    console.log('fetchDocument(' + documentId + ')');
    var document = client.cache[documentId];
    if (!document) {
        var source;
        try {
            source = fs.readFileSync(client.documents + documentId);
        } catch (e) {
            return;  // undefined
        }
        if (!citation.sourceMatches(source)) {
            throw new Error('CLOUD: The citation to the following document is invalid: ' + citation + '\n' + document);
        }
        document = language.parseDocument(source);
        try {
            validateDocument(client, documentId, document);
        } catch (e) {
            throw new Error('CLOUD: The following document is invalid: ' + document);
        }
        cacheDocument(client, documentId, document);
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

function storeDocument(client, documentId, document) {
    console.log('storeDocument(' + documentId + ')');
    client.notaryKey.notarizeDocument(document);
    try {
        fs.writeFileSync(client.documents + documentId, document, 0o400);
    } catch (e) {
        throw new Error('CLOUD: The following document could not be stored in the filesystem: ' + documentId + '\n' + document);
    }
}

function cacheDocument(client, documentId, document) {
    console.log('cacheDocument(' + documentId + ')');
    if (client.cache.size > MAX_CACHE_SIZE) {
        // delete the first (oldest) cached document
        var key = client.cache.keys().next().value;
        client.cache.delete(key);
    }
    client.cache[documentId] = document;
}