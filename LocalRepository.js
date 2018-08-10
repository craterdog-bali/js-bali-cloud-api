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
 * This class provides a local filesystem based document repository. It treats documents
 * as UTF-8 encoded strings. It can be used with the CloudAPI class for local testing.
 */
var fs = require('fs');
var random = require('bali-utilities/RandomUtilities');


function LocalRepository(filesystem) {
    this.drafts = filesystem + '/drafts/';
    this.documents = filesystem + '/documents/';
    this.queues = filesystem + '/queues/';
    try {
        if (!fs.existsSync(filesystem)) fs.mkdirSync(filesystem);
        if (!fs.existsSync(this.drafts)) fs.mkdirSync(this.drafts);
        if (!fs.existsSync(this.documents)) fs.mkdirSync(this.documents);
        if (!fs.existsSync(this.queues)) fs.mkdirSync(this.queues);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    return this;
}
LocalRepository.prototype.constructor = LocalRepository;
exports.LocalRepository = LocalRepository;


LocalRepository.prototype.draftExists = function(draftId) {
    try {
        var filename = this.drafts + draftId;
        return fs.existsSync(filename);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.fetchDraft = function(draftId) {
    var draft;
    try {
        var filename = this.drafts + draftId;
        if (fs.existsSync(filename)) {
            draft = fs.readFileSync(filename).toString();
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    return draft;
};


LocalRepository.prototype.storeDraft = function(draftId, draft) {
    try {
        var filename = this.drafts + draftId;
        fs.writeFileSync(filename, draft, {encoding: 'utf8', mode: 384});
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.deleteDraft = function(draftId) {
    try {
        var filename = this.drafts + draftId;
        if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.documentExists = function(documentId) {
    try {
        var filename = this.documents + documentId;
        return fs.existsSync(filename);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.fetchDocument = function(documentId) {
    var document;
    try {
        var filename = this.documents + documentId;
        if (fs.existsSync(filename)) {
            document = fs.readFileSync(filename).toString();
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    return document;
};


LocalRepository.prototype.storeDocument = function(documentId, document) {
    var filename = this.documents + documentId;
    var exists;
    try {
        exists = fs.existsSync(filename);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    if (exists) {
        throw new Error('REPOSITORY: The following document already exists in the filesystem: ' + documentId);
    }
    try {
        fs.writeFileSync(filename, document, {encoding: 'utf8', mode: 256});
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.queueMessage = function(queueId, messageId, message) {
    var directory = this.queues + queueId + '/';
    var filename = directory + messageId;
    var exists;
    try {
        if (!fs.existsSync(directory)) fs.mkdirSync(directory);
        exists = fs.existsSync(filename);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    if (exists) {
        throw new Error('REPOSITORY: The following message already exists in the queue: ' + messageId);
    }
    try {
        fs.writeFileSync(filename, message, {encoding: 'utf8', mode: 384});
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.dequeueMessage = function(queueId) {
    var directory = this.queues + queueId + '/';
    var message;
    try {
        while (fs.existsSync(directory)) {
            var messages = fs.readdirSync(directory);
            var count = messages.length;
            if (count) {
                var index = 0;
                if (count > 1) {
                    index = random.generateRandomIndex(count);
                }
                var messageId = messages[index];
                var filename = directory + messageId;
                message = fs.readFileSync(filename).toString();
                try {
                    fs.unlinkSync(filename);
                    break; // we got there first
                } catch (e) {
                    // another process got there first
                    message = undefined;
                }
            } else {
                break;  // no more messages
            }
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    return message;
};
