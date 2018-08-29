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
var BaliCitation = require('bali-digital-notary/BaliCitation');
var BaliDocument = require('bali-document-notation/BaliDocument');
var codex = require('bali-document-notation/utilities/EncodingUtilities');


/**
 * This function returns an object that implements the API for the Bali Cloud Environment™.
 *
 * @param {Object} notary An object that implements the API for the digital notary.
 * @param {Object} repository An object that implements the API for the document repository.
 * @returns {Object} An object that implements the API for the Bali Cloud Environment™.
 */
exports.environment = function(notary, repository) {
    var SEND_QUEUE_ID = 'JXT095QY01HBLHPAW04ZR5WSH41MWG4H';
    var EVENT_QUEUE_ID = '3RMGDVN7D6HLAPFXQNPF7DV71V3MAL43';

    // return the client API instance
    return {

        retrieveCitation: function() {
            var citation = notary.citation();
            return citation;
        },

        nextVersion: function(citation) {
            // calculate the next logical version string
            var numbers = citation.version.slice(1).split('.');
            var last = numbers.length - 1;
            var newValue = Number(numbers[last]) + 1;
            numbers[last] = newValue.toString();
            return 'v' + numbers.join('.');
        },

        retrieveCertificate: function(citation) {
            var certificate = fetchCertificate(notary, repository, citation);
            return certificate;
        },

        checkoutDocument: function(citation, newVersion) {
            var tag = citation.tag;
            var currentVersion = citation.version;
        
            // validate the new version number
            if (!validNextVersion(currentVersion, newVersion)) {
                throw new Error('API: The new version (' + newVersion + ') is not a valid next version for: ' + currentVersion);
            }

            // make sure the new version of the document doesn't already exist
            if (fetchDocumentFromCache(tag, newVersion) || repository.documentExists(tag, newVersion) ||
                    repository.draftExists(tag, newVersion)) {
                throw new Error('API: The new version of the document being checked out already exists: ' + tag + newVersion);
            }

            // fetch the document
            var document = fetchDocument(notary, repository, citation);
            if (!document) {
                throw new Error('API: The document being checked does not exist: ' + tag + currentVersion);
            }

            // store a stripped copy of the current version as a draft of the new version
            var draft = document.draft(citation.toReference());
            repository.storeDraft(tag, newVersion, draft);

            return draft;
        },

        saveDraft: function(tag, version, draft) {
            if (fetchDocumentFromCache(tag, version) || repository.documentExists(tag, version)) {
                throw new Error('API: The draft being saved is already committed: ' + tag + version);
            }
            repository.storeDraft(tag, version, draft);
        },

        retrieveDraft: function(tag, version) {
            var draft;
            var source = repository.fetchDraft(tag, version);
            if (source) {
                // validate the draft
                draft = BaliDocument.fromSource(source);
                // don't cache drafts since they are mutable
            }
            return draft;
        },

        discardDraft: function(tag, version) {
            repository.deleteDraft(tag, version);
        },

        commitDocument: function(tag, version, document) {
            // store the new version of the document in the repository
            if (repository.documentExists(tag, version)) {
                throw new Error('API: The document being saved is already committed: ' + tag + version);
            }
            var citation = notary.notarizeDocument(tag, version, document);
            validateDocument(notary, repository, citation, document);
            repository.storeDocument(tag, version, document);
            storeDocumentInCache(tag, version, document);

            // delete the stored draft if one exists from the repository
            if (repository.draftExists(tag, version)) repository.deleteDraft(tag, version);

            return citation;
        },

        retrieveDocument: function(citation) {
            var document = fetchDocument(notary, repository, citation);
            return document;
        },

        sendMessage: function(target, message) {
            message.setValue('$target', target);
            var tag = codex.randomTag();
            message.setValue('$tag', tag);
            notary.notarizeDocument(tag, 'v1', message);
            repository.queueMessage(SEND_QUEUE_ID, tag, message);
        },

        queueMessage: function(queue, message) {
            var tag = codex.randomTag();
            message.setValue('$tag', tag);
            notary.notarizeDocument(tag, 'v1', message);
            repository.queueMessage(queue, tag, message);
        },

        receiveMessage: function(queue) {
            var message;
            var source = repository.dequeueMessage(queue);
            if (source) {
                // validate the document
                message = BaliDocument.fromSource(source);
            }
            return message;
        },

        publishEvent: function(event) {
            var tag = codex.randomTag();
            event.setValue('$tag', tag);
            notary.notarizeDocument(tag, 'v1', event);
            repository.queueMessage(EVENT_QUEUE_ID, tag, event);
        }
    };
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


function fetchCertificate(notary, repository, citation) {
    // check the cache
    var tag = citation.tag;
    var version = citation.version;
    var certificate = fetchCertificateFromCache(tag, version);

    // next check the repository if necessary
    if (!certificate) {
        var source = repository.fetchCertificate(tag, version);
        if (source) {
            // validate the certificate
            certificate = BaliDocument.fromSource(source);
            validateCertificate(notary, citation, certificate);

            // cache the certificate
            storeCertificateInCache(tag, version, certificate);
        }
    }

    return certificate;
}


function validateCertificate(notary, citation, certificate) {
    var certificateTag = certificate.getString('$tag');
    var certificateVersion = certificate.getString('$version');
    var seal = certificate.getLastSeal();
    var sealCitation = BaliCitation.fromReference(seal.certificateReference);
    var sealTag = sealCitation.tag;
    var sealVersion = sealCitation.version;
    if (!notary.documentMatches(citation, certificate) ||
        citation.tag !== certificateTag || certificateTag !== sealTag ||
        citation.version !== certificateVersion || certificateVersion !== sealVersion) {
        throw new Error('API: The following are incompatible:\ncitation: ' + citation + '\ncertificate: ' + certificate);
    }
    if (!notary.documentIsValid(certificate, certificate)) {
        throw new Error('API: The following certificate is invalid:\n' + certificate);
    }
}


function fetchDocument(notary, repository, citation) {
    // check the cache
    var tag = citation.tag;
    var version = citation.version;
    var document = fetchDocumentFromCache(tag, version);

    // next check the repository if necessary
    if (!document) {
        var source = repository.fetchDocument(tag, version);
        if (source) {
            // validate the document
            document = BaliDocument.fromSource(source);
            validateDocument(notary, repository, citation, document);

            // cache the document
            storeDocumentInCache(tag, version, document);
        }
    }

    return document;
}


function validateDocument(notary, repository, citation, document) {
    if (!notary.documentMatches(citation, document)) {
        throw new Error('API: The following are incompatible:\ncitation: ' + citation + '\ndocument: ' + document);
    }
    var seal = document.getLastSeal();
    while (seal) {
        var certificateCitation = BaliCitation.fromReference(seal.certificateReference);
        var certificate = fetchCertificate(notary, repository, certificateCitation);
        if (!notary.documentIsValid(certificate, document)) {
            throw new Error('API: The following document is invalid:\n' + document);
        }
        document = document.unsealed();
        seal = document.getLastSeal();
    }
}


// This defines the caches for the client side API.
// Since all documents are immutable, there are no cache consistency issues.
// The caching rules are as follows:
// 1) The cache is always checked before downloading a document.
// 2) A downloaded document is always validated before use.
// 3) A validated document is always cached locally.
// 4) The cache will delete the oldest document when it is full.

var MAX_DOCUMENT_CACHE_SIZE = 64;
var DOCUMENT_CACHE = new Map();
function storeDocumentInCache(tag, version, document) {
    if (DOCUMENT_CACHE.size > MAX_DOCUMENT_CACHE_SIZE) {
        // delete the first (oldest) cached document
        var key = DOCUMENT_CACHE.keys().next().value;
        DOCUMENT_CACHE.delete(key);
    }
    DOCUMENT_CACHE.set(tag + version, document);
}
function fetchDocumentFromCache(tag, version) {
    var document = DOCUMENT_CACHE.get(tag + version);
    return document;
}

var MAX_CERTIFICATE_CACHE_SIZE = 64;
var CERTIFICATE_CACHE = new Map();
function storeCertificateInCache(tag, version, certificate) {
    if (CERTIFICATE_CACHE.size > MAX_CERTIFICATE_CACHE_SIZE) {
        // delete the first (oldest) cached certificate
        var key = CERTIFICATE_CACHE.keys().next().value;
        CERTIFICATE_CACHE.delete(key);
    }
    CERTIFICATE_CACHE.set(tag + version, certificate);
}
function fetchCertificateFromCache(tag, version) {
    var certificate = CERTIFICATE_CACHE.get(tag + version);
    return certificate;
}
