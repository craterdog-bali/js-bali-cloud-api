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
var codex = require('bali-document-notation/utilities/EncodingUtilities');
var config = require('os').homedir() + '/.bali/';
var fs = require('fs');


function LocalRepository(testDirectory) {
    if (testDirectory) config = testDirectory;
    var directory = config + 'repository/';
    this.certificates = directory + 'certificates/';
    this.drafts = directory + 'drafts/';
    this.documents = directory + 'documents/';
    this.queues = directory + 'queues/';
    try {
        // create the repository directory structure if necessary (with drwx------ permissions)
        if (!fs.existsSync(config)) fs.mkdirSync(config, 448);
        if (!fs.existsSync(directory)) fs.mkdirSync(directory, 448);
        if (!fs.existsSync(this.certificates)) fs.mkdirSync(this.certificates, 448);
        if (!fs.existsSync(this.drafts)) fs.mkdirSync(this.drafts, 448);
        if (!fs.existsSync(this.documents)) fs.mkdirSync(this.documents, 448);
        if (!fs.existsSync(this.queues)) fs.mkdirSync(this.queues, 448);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    return this;
}
LocalRepository.prototype.constructor = LocalRepository;
exports.LocalRepository = LocalRepository;


LocalRepository.prototype.certificateExists = function(tag, version) {
    var certificateId = tag + version;
    var filename = this.certificates + certificateId;
    try {
        return fs.existsSync(filename);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.fetchCertificate = function(tag, version) {
    var certificateId = tag + version;
    var filename = this.certificates + certificateId;
    var certificate;
    try {
        if (fs.existsSync(filename)) {
            certificate = fs.readFileSync(filename).toString();
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    return certificate;
};


LocalRepository.prototype.storeCertificate = function(tag, version, certificate) {
    var certificateId = tag + version;
    var filename = this.certificates + certificateId;
    var exists;
    try {
        exists = fs.existsSync(filename);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    if (exists) {
        throw new Error('REPOSITORY: The following certificate already exists in the filesystem: ' + certificateId);
    }
    try {
        fs.writeFileSync(filename, certificate, {encoding: 'utf8', mode: 256});
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.draftExists = function(tag, version) {
    var draftId = tag + version;
    var filename = this.drafts + draftId;
    try {
        return fs.existsSync(filename);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.fetchDraft = function(tag, version) {
    var draftId = tag + version;
    var filename = this.drafts + draftId;
    var draft;
    try {
        if (fs.existsSync(filename)) {
            draft = fs.readFileSync(filename).toString();
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    return draft;
};


LocalRepository.prototype.storeDraft = function(tag, version, draft) {
    var draftId = tag + version;
    var filename = this.drafts + draftId;
    try {
        fs.writeFileSync(filename, draft, {encoding: 'utf8', mode: 384});
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.deleteDraft = function(tag, version) {
    var draftId = tag + version;
    var filename = this.drafts + draftId;
    try {
        if (fs.existsSync(filename)) {
            fs.unlinkSync(filename);
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.documentExists = function(tag, version) {
    var documentId = tag + version;
    var filename = this.documents + documentId;
    try {
        return fs.existsSync(filename);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
};


LocalRepository.prototype.fetchDocument = function(tag, version) {
    var documentId = tag + version;
    var filename = this.documents + documentId;
    var document;
    try {
        if (fs.existsSync(filename)) {
            document = fs.readFileSync(filename).toString();
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }
    return document;
};


LocalRepository.prototype.storeDocument = function(tag, version, document) {
    var documentId = tag + version;
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


LocalRepository.prototype.queueMessage = function(queue, tag, message) {
    var messageId = tag;
    var directory = this.queues + queue + '/';
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


LocalRepository.prototype.dequeueMessage = function(queue) {
    var directory = this.queues + queue + '/';
    var message;
    try {
        while (fs.existsSync(directory)) {
            var messages = fs.readdirSync(directory);
            var count = messages.length;
            if (count) {
                var index = 0;
                if (count > 1) {
                    index = codex.randomIndex(count);
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
