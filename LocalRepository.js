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
 * This module defines a singleton that provides a local filesystem based document
 * repository. It treats documents as UTF-8 encoded strings. It can be used for local
 * testing of the Bali Cloud Environment™. If a test directory is specified, it will
 * be created and used as the repository. Otherwise, a repository directory will be
 * created and used within a '.bali/' directory in the home directory for the running
 * process.
 */
var codex = require('bali-document-notation/utilities/EncodingUtilities');
var homeDirectory = require('os').homedir() + '/.bali/';
var fs = require('fs');


/**
 * This function returns a reference to the local repository.  If the repository does
 * not yet exist it is created.
 * 
 * @param {String} testDirectory The location of the test directory to be used for the
 * repository. If not specified, the location of the repository is in '~/.bali/repository/'.
 * @returns {Object} An object containing the functions that the repository supports.
 */
exports.repository = function(testDirectory) {
    if (testDirectory) homeDirectory = testDirectory;
    var repositoryDirectory = homeDirectory + 'repository/';
    var certificates = repositoryDirectory + 'certificates/';
    var drafts = repositoryDirectory + 'drafts/';
    var documents = repositoryDirectory + 'documents/';
    var queues = repositoryDirectory + 'queues/';
    try {
        // create the repository directory structure if necessary (with drwx------ permissions)
        if (!fs.existsSync(homeDirectory)) fs.mkdirSync(homeDirectory, 448);
        if (!fs.existsSync(repositoryDirectory)) fs.mkdirSync(repositoryDirectory, 448);
        if (!fs.existsSync(certificates)) fs.mkdirSync(certificates, 448);
        if (!fs.existsSync(drafts)) fs.mkdirSync(drafts, 448);
        if (!fs.existsSync(documents)) fs.mkdirSync(documents, 448);
        if (!fs.existsSync(queues)) fs.mkdirSync(queues, 448);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }

    return {

        toString: function() {
            // TODO: print out the directory tree for the local repository
            throw new Error('REPOSITORY: The toString() method is not yet implemented.');
        },

        certificateExists: function(tag, version) {
            var certificateId = tag + version;
            var filename = certificates + certificateId;
            try {
                return fs.existsSync(filename);
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        fetchCertificate: function(tag, version) {
            var certificateId = tag + version;
            var filename = certificates + certificateId;
            var certificate;
            try {
                if (fs.existsSync(filename)) {
                    certificate = fs.readFileSync(filename).toString();
                }
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
            return certificate;
        },

        storeCertificate: function(tag, version, certificate) {
            var certificateId = tag + version;
            var filename = certificates + certificateId;
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
        },

        draftExists: function(tag, version) {
            var draftId = tag + version;
            var filename = drafts + draftId;
            try {
                return fs.existsSync(filename);
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        fetchDraft: function(tag, version) {
            var draftId = tag + version;
            var filename = drafts + draftId;
            var draft;
            try {
                if (fs.existsSync(filename)) {
                    draft = fs.readFileSync(filename).toString();
                }
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
            return draft;
        },

        storeDraft: function(tag, version, draft) {
            var draftId = tag + version;
            var filename = drafts + draftId;
            try {
                fs.writeFileSync(filename, draft, {encoding: 'utf8', mode: 384});
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        deleteDraft: function(tag, version) {
            var draftId = tag + version;
            var filename = drafts + draftId;
            try {
                if (fs.existsSync(filename)) {
                    fs.unlinkSync(filename);
                }
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        documentExists: function(tag, version) {
            var documentId = tag + version;
            var filename = documents + documentId;
            try {
                return fs.existsSync(filename);
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        fetchDocument: function(tag, version) {
            var documentId = tag + version;
            var filename = documents + documentId;
            var document;
            try {
                if (fs.existsSync(filename)) {
                    document = fs.readFileSync(filename).toString();
                }
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
            return document;
        },

        storeDocument: function(tag, version, document) {
            var documentId = tag + version;
            var filename = documents + documentId;
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
        },

        queueMessage: function(queue, tag, message) {
            var messageId = tag;
            var directory = queues + queue + '/';
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
        },

        dequeueMessage: function(queue) {
            var directory = queues + queue + '/';
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
        }

    };
};
