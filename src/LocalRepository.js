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

///////////////////////////////////////////////////////////////////////////////////////
// This module should be used for LOCAL TESTING ONLY.  It is NOT SECURE and provides //
// no guarantees on protecting access to the documents.  YOU HAVE BEEN WARNED!!!     //
///////////////////////////////////////////////////////////////////////////////////////


/*
 * This module defines a singleton that implements a local filesystem based document
 * repository. It treats documents as UTF-8 encoded strings. It can be used for local
 * testing of the Bali Cloud Environment™. If a test directory is specified, it will
 * be created and used as the repository. Otherwise, a repository directory will be
 * created and used within a '.bali/' directory in the home directory for the running
 * process.
 */
var fs = require('fs');
var homeDirectory = require('os').homedir() + '/.bali/';
var bali = require('bali-document-framework');


/**
 * This function returns an object that implements the API for a local TEST document
 * repository. If the repository does not yet exist it is created.
 * 
 * @param {String} testDirectory The location of the test directory to be used for the
 * repository. If not specified, the location of the repository is in '~/.bali/repository/'.
 * @returns {Object} An object containing the functions that the repository supports.
 */
exports.api = function(testDirectory) {
    if (testDirectory) homeDirectory = testDirectory;
    var repositoryDirectory = homeDirectory + 'repository/';
    var certificates = repositoryDirectory + 'certificates/';
    var drafts = repositoryDirectory + 'drafts/';
    var documents = repositoryDirectory + 'documents/';
    var types = repositoryDirectory + 'types/';
    var queues = repositoryDirectory + 'queues/';
    try {
        // create the repository directory structure if necessary (with drwx------ permissions)
        if (!fs.existsSync(homeDirectory)) fs.mkdirSync(homeDirectory, 448);
        if (!fs.existsSync(repositoryDirectory)) fs.mkdirSync(repositoryDirectory, 448);
        if (!fs.existsSync(certificates)) fs.mkdirSync(certificates, 448);
        if (!fs.existsSync(drafts)) fs.mkdirSync(drafts, 448);
        if (!fs.existsSync(documents)) fs.mkdirSync(documents, 448);
        if (!fs.existsSync(types)) fs.mkdirSync(types, 448);
        if (!fs.existsSync(queues)) fs.mkdirSync(queues, 448);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
    }

    return {

        toString: function() {
            // TODO: print out the directory tree for the local repository
            throw new Error('REPOSITORY: The toString() method is not yet implemented.');
        },

        certificateExists: function(certificateId) {
            var filename = certificates + certificateId + '.bali';
            try {
                return fs.existsSync(filename);
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        fetchCertificate: function(certificateId) {
            var filename = certificates + certificateId + '.bali';
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

        storeCertificate: function(certificate) {
            var certificateId = certificate.getValue('$tag').toString() + certificate.getValue('$version');
            var filename = certificates + certificateId + '.bali';
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
                fs.writeFileSync(filename, certificate.toString(), {encoding: 'utf8', mode: 256});
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        draftExists: function(draftId) {
            var filename = drafts + draftId + '.bali';
            try {
                return fs.existsSync(filename);
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        fetchDraft: function(draftId) {
            var filename = drafts + draftId + '.bali';
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

        storeDraft: function(draftId, draft) {
            var filename = drafts + draftId + '.bali';
            try {
                fs.writeFileSync(filename, draft.toString(), {encoding: 'utf8', mode: 384});
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        deleteDraft: function(draftId) {
            var filename = drafts + draftId + '.bali';
            try {
                if (fs.existsSync(filename)) {
                    fs.unlinkSync(filename);
                }
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        documentExists: function(documentId) {
            var filename = documents + documentId + '.bali';
            try {
                return fs.existsSync(filename);
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        fetchDocument: function(documentId) {
            var filename = documents + documentId + '.bali';
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

        storeDocument: function(documentId, document) {
            var filename = documents + documentId + '.bali';
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
                fs.writeFileSync(filename, document.toString(), {encoding: 'utf8', mode: 256});
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        typeExists: function(typeId) {
            var filename = types + typeId + '.bali';
            try {
                return fs.existsSync(filename);
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        fetchType: function(typeId) {
            var filename = types + typeId + '.bali';
            var type;
            try {
                if (fs.existsSync(filename)) {
                    type = fs.readFileSync(filename).toString();
                }
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
            return type;
        },

        storeType: function(typeId, type) {
            var filename = types + typeId + '.bali';
            var exists;
            try {
                exists = fs.existsSync(filename);
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
            if (exists) {
                throw new Error('REPOSITORY: The following type already exists in the filesystem: ' + typeId);
            }
            try {
                fs.writeFileSync(filename, type.toString(), {encoding: 'utf8', mode: 256});
            } catch (e) {
                throw new Error('REPOSITORY: The filesystem is not currently accessible:\n' + e);
            }
        },

        queueMessage: function(queue, message) {
            var messageId = message.getValue('$tag');
            var directory = queues + queue + '/';
            var filename = directory + messageId + '.bali';
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
                fs.writeFileSync(filename, message.toString(), {encoding: 'utf8', mode: 384});
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
                            index = bali.codex.randomIndex(count);
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
