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
 * testing of the Bali Nebula™. If a test directory is specified, it will be created
 * and used as the repository. Otherwise, a repository directory will be created and
 * used within a '.bali/' directory in the home directory for the running process.
 */
const fs = require('fs');
const os = require('os');
const bali = require('bali-component-framework');


/**
 * This function returns an object that implements the API for a local TEST document
 * repository. If the repository does not yet exist it is created.
 * 
 * @param {String} testDirectory The location of the test directory to be used for the
 * repository. If not specified, the location of the repository is in '~/.bali/repository/'.
 * @returns {Object} An object implementing the document repository interface.
 */
exports.repository = function(testDirectory) {
    // create the config directory if necessary
    const configDirectory = testDirectory || os.homedir() + '/.bali/';
    const repositoryDirectory = configDirectory + 'repository/';
    const certificates = repositoryDirectory + 'certificates/';
    const drafts = repositoryDirectory + 'drafts/';
    const documents = repositoryDirectory + 'documents/';
    const types = repositoryDirectory + 'types/';
    const queues = repositoryDirectory + 'queues/';
    try {
        // create the repository directory structure if necessary (with drwx------ permissions)
        if (!fs.existsSync(configDirectory)) fs.mkdirSync(configDirectory, 448);
        if (!fs.existsSync(repositoryDirectory)) fs.mkdirSync(repositoryDirectory, 448);
        if (!fs.existsSync(certificates)) fs.mkdirSync(certificates, 448);
        if (!fs.existsSync(drafts)) fs.mkdirSync(drafts, 448);
        if (!fs.existsSync(documents)) fs.mkdirSync(documents, 448);
        if (!fs.existsSync(types)) fs.mkdirSync(types, 448);
        if (!fs.existsSync(queues)) fs.mkdirSync(queues, 448);
    } catch (e) {
        throw bali.exception({
            $module: '$LocalRepository',
            $procedure: '$repository',
            $exception: '$directoryAccess',
            $directory: '"' + configDirectory + '"',
            $message: '"The local configuration directory could not be accessed."'
        });
    }

    return {

        toString: function() {
            // TODO: print out the directory tree for the local repository
            throw new Error('REPOSITORY: The toString() method is not yet implemented.');
        },

        certificateExists: function(certificateId) {
            try {
                const filename = certificates + certificateId + '.ndoc';
                return fs.existsSync(filename);
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$certificateExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + certificates + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        fetchCertificate: function(certificateId) {
            try {
                const filename = certificates + certificateId + '.ndoc';
                if (fs.existsSync(filename)) {
                    const certificate = fs.readFileSync(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                    return certificate;
                }
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$fetchCertificate',
                    $exception: '$directoryAccess',
                    $directory: '"' + certificates + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        storeCertificate: function(certificateId, certificate) {
            try {
                const filename = certificates + certificateId + '.ndoc';
                const exists = fs.existsSync(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $procedure: '$storeCertificate',
                        $exception: '$fileExists',
                        $directory: '"' + certificates + '"',
                        $file: '"' + certificateId + '.ndoc"',
                        $message: '"The file to be written already exists."'
                    });
                }
                const document = certificate.toString() + '\n';  // add POSIX compliant <EOL>
                fs.writeFileSync(filename, document, {encoding: 'utf8', mode: 256});
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$storeCertificate',
                    $exception: '$directoryAccess',
                    $directory: '"' + certificates + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        draftExists: function(draftId) {
            try {
                const filename = drafts + draftId + '.ndoc';
                return fs.existsSync(filename);
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$draftExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        fetchDraft: function(draftId) {
            try {
                const filename = drafts + draftId + '.ndoc';
                if (fs.existsSync(filename)) {
                    const draft = fs.readFileSync(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                    return draft;
                }
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$fetchDraft',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        storeDraft: function(draftId, draft) {
            try {
                const filename = drafts + draftId + '.ndoc';
                const document = draft.toString() + '\n';  // add POSIX compliant <EOL>
                fs.writeFileSync(filename, document, {encoding: 'utf8', mode: 384});
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$storeDraft',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        deleteDraft: function(draftId) {
            try {
                const filename = drafts + draftId + '.ndoc';
                if (fs.existsSync(filename)) {
                    fs.unlinkSync(filename);
                }
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$deleteDraft',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        documentExists: function(documentId) {
            try {
                const filename = documents + documentId + '.ndoc';
                return fs.existsSync(filename);
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$documentExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + documents + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        fetchDocument: function(documentId) {
            try {
                const filename = documents + documentId + '.ndoc';
                if (fs.existsSync(filename)) {
                    const document = fs.readFileSync(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                    return document;
                }
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$fetchDocument',
                    $exception: '$directoryAccess',
                    $directory: '"' + documents + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        storeDocument: function(documentId, document) {
            try {
                const filename = documents + documentId + '.ndoc';
                const exists = fs.existsSync(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $procedure: '$storeDocument',
                        $exception: '$fileExists',
                        $directory: '"' + documents + '"',
                        $file: '"' + documentId + '.ndoc"',
                        $message: '"The file to be written already exists."'
                    });
                }
                document = document.toString() + '\n';  // add POSIX compliant <EOL>
                fs.writeFileSync(filename, document, {encoding: 'utf8', mode: 256});
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$storeDocument',
                    $exception: '$directoryAccess',
                    $directory: '"' + documents + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        typeExists: function(typeId) {
            try {
                const filename = types + typeId + '.ndoc';
                return fs.existsSync(filename);
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$typeExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + types + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        fetchType: function(typeId) {
            try {
                const filename = types + typeId + '.ndoc';
                if (fs.existsSync(filename)) {
                    const type = fs.readFileSync(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                    return type;
                }
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$fetchType',
                    $exception: '$directoryAccess',
                    $directory: '"' + types + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        storeType: function(typeId, type) {
            try {
                const filename = types + typeId + '.ndoc';
                const exists = fs.existsSync(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $procedure: '$storeType',
                        $exception: '$fileExists',
                        $directory: '"' + types + '"',
                        $file: '"' + typeId + '.ndoc"',
                        $message: '"The file to be written already exists."'
                    });
                }
                const document = type.toString() + '\n';  // add POSIX compliant <EOL>
                fs.writeFileSync(filename, document, {encoding: 'utf8', mode: 256});
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$storeType',
                    $exception: '$directoryAccess',
                    $directory: '"' + types + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        queueMessage: function(queue, messageId, message) {
            try {
                const directory = queues + queue + '/';
                const filename = directory + messageId + '.ndoc';
                if (!fs.existsSync(directory)) fs.mkdirSync(directory);
                const exists = fs.existsSync(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $procedure: '$queueMessage',
                        $exception: '$fileExists',
                        $directory: '"' + directory + '"',
                        $file: '"' + messageId + '.ndoc"',
                        $message: '"The file to be written already exists."'
                    });
                }
                const document = message.toString() + '\n';  // add POSIX compliant <EOL>
                fs.writeFileSync(filename, document, {encoding: 'utf8', mode: 384});
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$queueMessage',
                    $exception: '$directoryAccess',
                    $directory: '"' + queues + queue + '/"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        dequeueMessage: function(queue) {
            try {
                var message;
                const directory = queues + queue + '/';
                while (fs.existsSync(directory)) {
                    const messages = fs.readdirSync(directory);
                    const count = messages.length;
                    if (count) {
                        // select a message a random since a distributed queue cannot guarantee FIFO
                        const index = bali.random.index(count) - 1;  // convert to zero based indexing
                        const messageId = messages[index];
                        const filename = directory + messageId;
                        message = fs.readFileSync(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
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
                return message;
            } catch (e) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$dequeueMessage',
                    $exception: '$directoryAccess',
                    $directory: '"' + queues + queue + '/"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        }

    };
};
