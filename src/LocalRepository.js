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
    debug = debug || false;
    const repositoryDirectory = directory + 'repository/';
    const certificates = repositoryDirectory + 'certificates/';
    const drafts = repositoryDirectory + 'drafts/';
    const documents = repositoryDirectory + 'documents/';
    const types = repositoryDirectory + 'types/';
    const queues = repositoryDirectory + 'queues/';

    // return a singleton object for the API
    return {

        /**
         * This function returns a string providing attributes about this repository.
         * 
         * @returns {String} A string providing attributes about this repository.
         */
        toString: function() {
            return bali.catalog({
                $module: '$LocalRepository',
                $url: this.getURL()
            });
        },

        /**
         * This function returns a reference to this document repository.
         * 
         * @returns {Reference} A reference to this document repository.
         */
        getURL: function() {
            return bali.reference('file:' + directory);
        },

        /**
         * This function initializes the document repository.  It must be called before any
         * other API function and can only be called once.
         */
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
                this.initializeAPI = undefined;  // can only be called once
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$LocalRepository',
                    $function: '$initializeAPI',
                    $exception: '$unexpected',
                    $url: this.getURL(),
                    $text: bali.text('An unexpected error occurred while attempting to initialize the API.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function checks to see whether or not a certificate is associated with the
         * specified identifier.
         * 
         * @param {String} certificateId The unique identifier (including version number) for
         * the certificate being checked.
         * @returns {Boolean} Whether or not the certificate exists.
         */
        certificateExists: async function(certificateId) {
            try {
                const filename = certificates + certificateId + '.bali';
                const exists = await doesExist(filename);
                return exists;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$LocalRepository',
                    $function: '$certificateExists',
                    $exception: '$unexpected',
                    $url: bali.reference('file:' + directory),
                    $certificateId: certificateId ? bali.text(certificateId) : bali.NONE,
                    $text: bali.text('An unexpected error occurred while attempting to see if a certificate exists.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function attempts to retrieve the specified certificate from the repository.
         * 
         * @param {String} certificateId The unique identifier (including version number) for
         * the certificate being fetched.
         * @returns {String} The canonical source string for the certificate, or
         * <code>undefined</code> if it doesn't exist.
         */
        fetchCertificate: async function(certificateId) {
            try {
                var certificate;
                const filename = certificates + certificateId + '.bali';
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
                    $url: bali.reference('file:' + directory),
                    $certificateId: certificateId ? bali.text(certificateId) : bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function creates a new certificate in the repository.
         * 
         * @param {String} certificateId The unique identifier (including version number) for
         * the certificate being created.
         * @param {String} certificate The canonical source string for the certificate.
         */
        createCertificate: async function(certificateId, certificate) {
            try {
                const filename = certificates + certificateId + '.bali';
                const exists = await doesExist(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$createCertificate',
                        $exception: '$fileExists',
                        $url: bali.reference('file:' + directory),
                        $file: bali.text(filename),
                        $text: bali.text('The file to be written already exists.')
                    });
                }
                const document = certificate + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$createCertificate',
                    $exception: '$directoryAccess',
                    $url: bali.reference('file:' + directory),
                    $certificateId: certificateId ? bali.text(certificateId) : bali.NONE,
                    $certificate: certificate || bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function checks to see whether or not a draft document is associated with the
         * specified identifier.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being checked.
         * @returns {Boolean} Whether or not the draft document exists.
         */
        draftExists: async function(draftId) {
            try {
                const filename = drafts + draftId + '.bali';
                const exists = await doesExist(filename);
                return exists;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$draftExists',
                    $exception: '$directoryAccess',
                    $url: bali.reference('file:' + directory),
                    $draftId: draftId ? bali.text(draftId) : bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function attempts to retrieve the specified draft document from the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being fetched.
         * @returns {String} The canonical source string for the draft document, or
         * <code>undefined</code> if it doesn't exist.
         */
        fetchDraft: async function(draftId) {
            try {
                var draft;
                const filename = drafts + draftId + '.bali';
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
                    $url: bali.reference('file:' + directory),
                    $draftId: draftId ? bali.text(draftId) : bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function saves a draft document in the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being saved.
         * @param {String} draft The canonical source string for the draft document.
         */
        saveDraft: async function(draftId, draft) {
            try {
                const filename = drafts + draftId + '.bali';
                const document = draft + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o600});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$saveDraft',
                    $exception: '$directoryAccess',
                    $url: bali.reference('file:' + directory),
                    $draftId: draftId ? bali.text(draftId) : bali.NONE,
                    $draft: draft || bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function attempts to delete the specified draft document from the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being deleted.
         */
        deleteDraft: async function(draftId) {
            try {
                const filename = drafts + draftId + '.bali';
                const exists = await doesExist(filename);
                if (exists) {
                    await pfs.unlink(filename);
                }
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$deleteDraft',
                    $exception: '$directoryAccess',
                    $url: bali.reference('file:' + directory),
                    $draftId: draftId ? bali.text(draftId) : bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function checks to see whether or not a document is associated with the
         * specified identifier.
         * 
         * @param {String} documentId The unique identifier (including version number) for
         * the document being checked.
         * @returns {Boolean} Whether or not the document exists.
         */
        documentExists: async function(documentId) {
            try {
                const filename = documents + documentId + '.bali';
                const exists = await doesExist(filename);
                return exists;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$documentExists',
                    $exception: '$directoryAccess',
                    $url: bali.reference('file:' + directory),
                    $documentId: documentId ? bali.text(documentId) : bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function attempts to retrieve the specified document from the repository.
         * 
         * @param {String} documentId The unique identifier (including version number) for
         * the document being fetched.
         * @returns {String} The canonical source string for the document, or
         * <code>undefined</code> if it doesn't exist.
         */
        fetchDocument: async function(documentId) {
            try {
                var document;
                const filename = documents + documentId + '.bali';
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
                    $url: bali.reference('file:' + directory),
                    $documentId: documentId ? bali.text(documentId) : bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function creates a new document in the repository.
         * 
         * @param {String} documentId The unique identifier (including version number) for
         * the document being created.
         * @param {String} document The canonical source string for the document.
         */
        createDocument: async function(documentId, document) {
            try {
                const filename = documents + documentId + '.bali';
                const exists = await doesExist(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$createDocument',
                        $exception: '$fileExists',
                        $url: bali.reference('file:' + directory),
                        $file: bali.text(filename),
                        $text: bali.text('The file to be written already exists.')
                    });
                }
                document = document + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$createDocument',
                    $exception: '$directoryAccess',
                    $url: bali.reference('file:' + directory),
                    $documentId: documentId ? bali.text(documentId) : bali.NONE,
                    $document: document || bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function checks to see whether or not a type is associated with the
         * specified identifier.
         * 
         * @param {String} typeId The unique identifier (including version number) for
         * the type being checked.
         * @returns {Boolean} Whether or not the type exists.
         */
        typeExists: async function(typeId) {
            try {
                const filename = types + typeId + '.bali';
                const exists = await doesExist(filename);
                return exists;
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$typeExists',
                    $exception: '$directoryAccess',
                    $url: bali.reference('file:' + directory),
                    $typeId: typeId ? bali.text(typeId) : bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function attempts to retrieve the specified type from the repository.
         * 
         * @param {String} typeId The unique identifier (including version number) for
         * the type being fetched.
         * @returns {String} The canonical source string for the type, or
         * <code>undefined</code> if it doesn't exist.
         */
        fetchType: async function(typeId) {
            try {
                var type;
                const filename = types + typeId + '.bali';
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
                    $url: bali.reference('file:' + directory),
                    $typeId: typeId ? bali.text(typeId) : bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function creates a new type in the repository.
         * 
         * @param {String} typeId The unique identifier (including version number) for
         * the type being created.
         * @param {String} type The canonical source string for the type.
         */
        createType: async function(typeId, type) {
            try {
                const filename = types + typeId + '.bali';
                const exists = await doesExist(filename);
                if (exists) {
                    throw bali.exception({
                        $module: '$LocalRepository',
                        $function: '$createType',
                        $exception: '$fileExists',
                        $url: bali.reference('file:' + directory),
                        $file: bali.text(filename),
                        $text: bali.text('The file to be written already exists.')
                    });
                }
                const document = type + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o400});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$createType',
                    $exception: '$directoryAccess',
                    $url: bali.reference('file:' + directory),
                    $typeId: typeId ? bali.text(typeId) : bali.NONE,
                    $type: type || bali.NONE,
                    $text: bali.text('The local configuration directory could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function adds a new message onto the specified queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue.
         * @param {String} message The canonical source string for the message.
         */
        queueMessage: async function(queueId, message) {
            const queue = queues + queueId + '/';
            const messageId = bali.tag().getValue();
            try {
                if (!await doesExist(queue)) await pfs.mkdir(queue, 0o700);
                const filename = queue + messageId + '.bali';
                const document = message + EOL;  // add POSIX compliant <EOL>
                await pfs.writeFile(filename, document, {encoding: 'utf8', mode: 0o600});
            } catch (exception) {
                throw bali.exception({
                    $module: '$LocalRepository',
                    $function: '$queueMessage',
                    $exception: '$queueAccess',
                    $queue: queue ? bali.text(queue) : bali.NONE,
                    $messageId: messageId ? bali.text(messageId) : bali.NONE,
                    $text: bali.text('The local queue could not be accessed.')
                }, exception);
            }
        },

        /**
         * This function removes a message (at random) from the specified queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue.
         * @returns {String} The canonical source string for the message.
         */
        dequeueMessage: async function(queueId) {
            const queue = queues + queueId + '/';
            try {
                var message;
                while (await doesExist(queue)) {
                    const messages = await pfs.readdir(queue);
                    const count = messages.length;
                    if (count) {
                        // select a message a random since a distributed queue cannot guarantee FIFO
                        const index = bali.random.index(count) - 1;  // convert to zero based indexing
                        const messageFile = messages[index];
                        const filename = queue + messageFile;
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
                    $exception: '$queueAccess',
                    $queue: queue ? bali.text(queue) : bali.NONE,
                    $text: bali.text('The local queue could not be accessed.')
                }, exception);
            }
        }

    };
};


// PRIVATE FUNCTIONS

const doesExist = async function(path) {
    var exists = true;
    try {
        await pfs.stat(path);
    } catch (exception) {
        if (exception.code === 'ENOENT') {
            // the path does not exist
            exists = false;
        } else {
            // something else went wrong
            throw exception;
        }
    }
    // the path exists
    return exists;
};
