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
const EOL = '\n';  // POSIX compliant end of line


/**
 * This function returns an object that implements the API for a local TEST document
 * repository. If the repository does not yet exist it is created.
 * 
 * @param {String} directory The location of the directory to be used for the repository.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} An object implementing the document repository interface.
 */
exports.repository = function(directory, debug) {

    // validate the parameters
    if (!directory || typeof directory !== 'string') {
        const exception = bali.exception({
            $module: '$LocalRepository',
            $function: '$repository',
            $exception: '$invalidParameter',
            $parameter: bali.text(directory.toString()),
            $message: bali.text('The directory string is invalid.')
        });
        throw exception;
    }
    debug = debug || false;

    const repositoryDirectory = directory + 'repository/';
    const certificates = repositoryDirectory + 'certificates/';
    const drafts = repositoryDirectory + 'drafts/';
    const documents = repositoryDirectory + 'documents/';
    const types = repositoryDirectory + 'types/';
    const queues = repositoryDirectory + 'queues/';

    return {

        toString: function() {
            return bali.catalog({
                $configuration: bali.text(directory),
                $repository: bali.text(repositoryDirectory)
            });
        },

        initializeAPI: async function() {
            try {
                // create the repository directory structure if necessary (with drwx------ permissions)
                await pfs.mkdir(directory, 0o700).catch(function() {});
                await pfs.mkdir(repositoryDirectory, 0o700).catch(function() {});
                await pfs.mkdir(certificates, 0o700).catch(function() {});
                await pfs.mkdir(drafts, 0o700).catch(function() {});
                await pfs.mkdir(documents, 0o700).catch(function() {});
                await pfs.mkdir(types, 0o700).catch(function() {});
                await pfs.mkdir(queues, 0o700).catch(function() {});
                this.initializeAPI = function() {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$initializeAPI',
                        $exception: '$alreadyInitialized',
                        $message: bali.text('The local repository API has already been initialized.')
                    });
                };
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$LocalRepository',
                    $function: '$initializeAPI',
                    $exception: '$unexpected',
                    $directory: bali.text(directory),
                    $message: bali.text('An unexpected error occurred while attempting to initialize the API.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        certificateExists: async function(certificateId) {
            // validate the parameters
            if (!certificateId || typeof certificateId !== 'string') {
                const exception = bali.exception({
                    $module: '$LocalRepository',
                    $function: '$certificateExists',
                    $exception: '$invalidParameter',
                    $parameter: bali.text(certificateId.toString()),
                    $message: bali.text('The certificate identifier string is invalid.')
                });
                throw exception;
            }

            try {
                const filename = certificates + certificateId + '.ndoc';
                const exists = await doesExist(filename);
                return exists;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$LocalRepository',
                    $function: '$certificateExists',
                    $exception: '$unexpected',
                    $directory: bali.text(directory),
                    $message: bali.text('An unexpected error occurred while attempting to see if a certificate exists.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        fetchCertificate: async function(certificateId) {
            // validate the parameters
            if (!certificateId || typeof certificateId !== 'string') {
                const exception = bali.exception({
                    $module: '$LocalRepository',
                    $function: '$fetchCertificate',
                    $exception: '$invalidParameter',
                    $parameter: bali.text(certificateId.toString()),
                    $message: bali.text('The certificate identifier string is invalid.')
                });
                throw exception;
            }

            try {
                var certificate;
                const filename = certificates + certificateId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    certificate = await pfs.readFile(filename);
                    certificate = certificate.toString().slice(0, -1);  // remove POSIX compliant <EOL>
                }
                return certificate;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$fetchCertificate',
                    $exception: '$directoryAccess',
                    $directory: bali.text(certificates),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        createCertificate: async function(certificateId, certificate) {
            try {
                const filename = certificates + certificateId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$createCertificate',
                        $exception: '$fileExists',
                        $directory: bali.text(certificates),
                        $file: bali.text(certificateId + '.ndoc'),
                        $message: bali.text('The file to be written already exists.')
                    });
                }
                const document = certificate.toString() + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$createCertificate',
                    $exception: '$directoryAccess',
                    $directory: bali.text(certificates),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
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
                    $function: '$draftExists',
                    $exception: '$directoryAccess',
                    $directory: bali.text(drafts),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        fetchDraft: async function(draftId) {
            try {
                var draft;
                const filename = drafts + draftId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    draft = await pfs.readFile(filename);
                    draft = draft.toString().slice(0, -1);  // remove POSIX compliant <EOL>
                }
                return draft;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$fetchDraft',
                    $exception: '$directoryAccess',
                    $directory: bali.text(drafts),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        createDraft: async function(draftId, draft) {
            try {
                const filename = drafts + draftId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$createDraft',
                        $exception: '$fileExists',
                        $directory: bali.text(drafts),
                        $file: bali.text(draftId + '.ndoc'),
                        $message: bali.text('The file to be written already exists.')
                    });
                }
                const document = draft.toString() + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o600});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$createDraft',
                    $exception: '$directoryAccess',
                    $directory: bali.text(drafts),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        updateDraft: async function(draftId, draft) {
            try {
                const filename = drafts + draftId + '.ndoc';
                const exists = await doesExist(filename);
                if (!exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$updateDraft',
                        $exception: '$fileMissing',
                        $directory: bali.text(drafts),
                        $file: bali.text(draftId + '.ndoc'),
                        $message: bali.text('The file to be updated does not exist.')
                    });
                }
                const document = draft.toString() + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o600});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$updateDraft',
                    $exception: '$directoryAccess',
                    $directory: bali.text(drafts),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
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
                    $function: '$deleteDraft',
                    $exception: '$directoryAccess',
                    $directory: bali.text(drafts),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
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
                    $function: '$documentExists',
                    $exception: '$directoryAccess',
                    $directory: bali.text(documents),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        fetchDocument: async function(documentId) {
            try {
                var document;
                const filename = documents + documentId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    document = await pfs.readFile(filename);
                    document = document.toString().slice(0, -1);  // remove POSIX compliant <EOL>
                }
                return document;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$fetchDocument',
                    $exception: '$directoryAccess',
                    $directory: bali.text(documents),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        createDocument: async function(documentId, document) {
            try {
                const filename = documents + documentId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$createDocument',
                        $exception: '$fileExists',
                        $directory: bali.text(documents),
                        $file: bali.text(documentId + '.ndoc'),
                        $message: bali.text('The file to be written already exists.')
                    });
                }
                document = document.toString() + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$createDocument',
                    $exception: '$directoryAccess',
                    $directory: bali.text(documents),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
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
                    $function: '$typeExists',
                    $exception: '$directoryAccess',
                    $directory: bali.text(types),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        fetchType: async function(typeId) {
            try {
                var type;
                const filename = types + typeId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    type = await pfs.readFile(filename);
                    type = type.toString().slice(0, -1);  // remove POSIX compliant <EOL>
                }
                return type;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$fetchType',
                    $exception: '$directoryAccess',
                    $directory: bali.text(types),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        createType: async function(typeId, type) {
            try {
                const filename = types + typeId + '.ndoc';
                const exists = await doesExist(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$createType',
                        $exception: '$fileExists',
                        $directory: bali.text(types),
                        $file: bali.text(typeId + '.ndoc'),
                        $message: bali.text('The file to be written already exists.')
                    });
                }
                const document = type.toString() + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$createType',
                    $exception: '$directoryAccess',
                    $directory: bali.text(types),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
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
                    $function: '$queueExists',
                    $exception: '$directoryAccess',
                    $directory: bali.text(directory),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        createQueue: async function(queueId) {
            const directory = queues + queueId;
            try {
                const exists = await doesExist(directory);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$createQueue',
                        $exception: '$directoryExists',
                        $directory: bali.text(directory),
                        $file: bali.text(queueId + '.ndoc'),
                        $message: bali.text('The directory to be created already exists.')
                    });
                }
                await pfs.mkdir(directory, 0o700);
                return bali.tag(queueId);
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$createQueue',
                    $exception: '$directoryAccess',
                    $directory: bali.text(directory),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        deleteQueue: async function(queueId) {
            const directory = queues + queueId;
            try {
                const exists = await doesExist(directory);
                if (exists) {
                    await pfs.rmdir(directory);
                }
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$deleteQueue',
                    $exception: '$directoryAccess',
                    $directory: bali.text(directory),
                    $error: bali.text(exception),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
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
                        $function: '$queueMessage',
                        $exception: '$fileExists',
                        $directory: bali.text(directory),
                        $file: bali.text(messageId + '.ndoc'),
                        $message: bali.text('The file to be written already exists.')
                    });
                }
                const document = message.toString() + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o600});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$queueMessage',
                    $exception: '$directoryAccess',
                    $directory: bali.text(directory),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
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
                        message = await pfs.readFile(filename);
                        message = message.toString().slice(0, -1);  // remove POSIX compliant <EOL>
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
                    $function: '$dequeueMessage',
                    $exception: '$directoryAccess',
                    $directory: bali.text(directory),
                    $message: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        }

    };
};


const doesExist = async function(path) {
    var exists = true;
    await pfs.stat(path).catch(function(exception) {
        if (exception.code === 'ENOENT') {
            exists = false;
        } else {
            throw exception;
        }
    });
    return exists;
};
