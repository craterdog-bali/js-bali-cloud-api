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
const pfs = require('fs').promises;
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
        pfs.mkdir(configDirectory, 0o700).then(function() {
            return pfs.mkdir(repositoryDirectory, 0o700);
        }).catch(function() {
            console.error('config directory exists');
        }).then(function() {
            return pfs.mkdir(certificates, 0o700);
        }).catch(function() {
            console.error('certificates directory exists');
        }).then(function() {
            return pfs.mkdir(drafts, 0o700);
        }).catch(function() {
            console.error('drafts directory exists');
        }).then(function() {
            return pfs.mkdir(documents, 0o700);
        }).catch(function() {
            console.error('documents directory exists');
        }).then(function() {
            return pfs.mkdir(types, 0o700);
        }).catch(function() {
            console.error('types directory exists');
        }).then(function() {
            return pfs.mkdir(queues, 0o700);
        }).catch(function() {
            console.error('queues directory exists');
        });
    } catch (exception) {
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

        certificateExists: async function(certificateId) {
            try {
                const filename = certificates + certificateId + '.ndoc';
                const exists = await doesExist(filename);
                return exists;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$certificateExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + certificates + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        fetchCertificate: async function(certificateId) {
            try {
                const filename = certificates + certificateId + '.ndoc';
                const exists = await doesExist(filename);
                const certificate = await pfs.readFile(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                return certificate;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$fetchCertificate',
                    $exception: '$directoryAccess',
                    $directory: '"' + certificates + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        storeCertificate: async function(certificateId, certificate) {
            try {
                const filename = certificates + certificateId + '.ndoc';
                const exists = await doesExist(filename);
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
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$storeCertificate',
                    $exception: '$directoryAccess',
                    $directory: '"' + certificates + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        draftExists: async function(draftId) {
            try {
                const filename = drafts + draftId + '.ndoc';
                const exists = await doesExist(filename);
                return exists;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$draftExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        fetchDraft: async function(draftId) {
            try {
                const filename = drafts + draftId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    const draft = await pfs.readFile(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                    return draft;
                }
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$fetchDraft',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        storeDraft: async function(draftId, draft) {
            try {
                const filename = drafts + draftId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $procedure: '$storeDraft',
                        $exception: '$fileExists',
                        $directory: '"' + drafts + '"',
                        $file: '"' + draftId + '.ndoc"',
                        $message: '"The file to be written already exists."'
                    });
                }
                const document = draft.toString() + '\n';  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o600});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$storeDraft',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        updateDraft: async function(draftId, draft) {
            try {
                const filename = drafts + draftId + '.ndoc';
                const exists = await doesExist(filename);
                if (!exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $procedure: '$updateDraft',
                        $exception: '$fileMissing',
                        $directory: '"' + drafts + '"',
                        $file: '"' + draftId + '.ndoc"',
                        $message: '"The file to be updated does not exist."'
                    });
                }
                const document = draft.toString() + '\n';  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o600});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$updateDraft',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        deleteDraft: async function(draftId) {
            try {
                const filename = drafts + draftId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    await pfs.unlink(filename);
                }
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$deleteDraft',
                    $exception: '$directoryAccess',
                    $directory: '"' + drafts + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        documentExists: async function(documentId) {
            try {
                const filename = documents + documentId + '.ndoc';
                const exists = await doesExist(filename);
                return exists;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$documentExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + documents + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        fetchDocument: async function(documentId) {
            try {
                const filename = documents + documentId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    const document = await pfs.readFile(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                    return document;
                }
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$fetchDocument',
                    $exception: '$directoryAccess',
                    $directory: '"' + documents + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        storeDocument: async function(documentId, document) {
            try {
                const filename = documents + documentId + '.ndoc';
                const exists = await doesExist(filename);
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
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$storeDocument',
                    $exception: '$directoryAccess',
                    $directory: '"' + documents + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        typeExists: async function(typeId) {
            try {
                const filename = types + typeId + '.ndoc';
                const exists = await doesExist(filename);
                return exists;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$typeExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + types + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        fetchType: async function(typeId) {
            try {
                const filename = types + typeId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    const type = await pfs.readFile(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                    return type;
                }
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$fetchType',
                    $exception: '$directoryAccess',
                    $directory: '"' + types + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        storeType: async function(typeId, type) {
            try {
                const filename = types + typeId + '.ndoc';
                const exists = await doesExist(filename);
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
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$storeType',
                    $exception: '$directoryAccess',
                    $directory: '"' + types + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        queueExists: async function(queueId) {
            const directory = queues + queueId;
            try {
                const exists = await doesExist(directory);
                return exists;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$queueExists',
                    $exception: '$directoryAccess',
                    $directory: '"' + directory + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        createQueue: async function(queueId) {
            const directory = queues + queueId;
            try {
                const exists = await doesExist(directory);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $procedure: '$createQueue',
                        $exception: '$directoryExists',
                        $directory: '"' + directory + '"',
                        $file: '"' + queueId + '.ndoc"',
                        $message: '"The directory to be created already exists."'
                    });
                }
                await pfs.mkdir(directory, 0o700);
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$createQueue',
                    $exception: '$directoryAccess',
                    $directory: '"' + directory + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        deleteQueue: async function(queueId) {
            const directory = queues + queueId;
            try {
                const exists = await doesExist(directory);
                if (exists) {
                    await pfs.rmdirSync(directory);
                }
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$deleteQueue',
                    $exception: '$directoryAccess',
                    $directory: '"' + directory + '"',
                    $error: '"' + exception + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        queueMessage: async function(queueId, message) {
            const directory = queues + queueId + '/';
            try {
                const messageId = bali.tag().getValue();
                const filename = directory + messageId + '.ndoc';
                const exists = await doesExist(filename);
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
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o600});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$queueMessage',
                    $exception: '$directoryAccess',
                    $directory: '"' + directory + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        },

        dequeueMessage: async function(queueId) {
            const directory = queues + queueId + '/';
            try {
                var message;
                while (await doesExist(directory)) {
                    const messages = await pfs.readdir(directory);
                    const count = messages.length;
                    if (count) {
                        // select a message a random since a distributed queue cannot guarantee FIFO
                        const index = bali.random.index(count) - 1;  // convert to zero based indexing
                        const messageFile = messages[index];
                        const filename = directory + messageFile;
                        message = await pfs.readFile(filename).toString().slice(0, -1);  // remove POSIX compliant <EOL>
                        try {
                            await pfs.unlink(filename);
                            break; // we got there first
                        } catch (exception) {
                            // another process got there first
                            message = undefined;
                        }
                    } else {
                        break;  // no more messages
                    }
                }
                return message;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $procedure: '$dequeueMessage',
                    $exception: '$directoryAccess',
                    $directory: '"' + directory + '"',
                    $message: '"The local configuration directory could not be accessed."'
                });
            }
        }

    };
};


const doesExist = async function(path) {
    var exists = true;
    await pfs.stat(path).catch(function(error) {
        if (error.code === "ENOENT") {
            exists = false;
        } else {
            throw error;
        }
    });
    return exists;
};