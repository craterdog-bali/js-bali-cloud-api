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
 * This module uses the singleton pattern to provide an object that implements the API
 * that is used to access an AWS cloud based document repository. It treats documents
 * as UTF-8 encoded strings.
 */
const bali = require('bali-component-framework');
const axios = require('axios');

/**
 * This function returns an object that implements the API for the AWS cloud document
 * repository.
 * 
 * @param {Object} notary An object that implements the API for the digital notary.
 * @param {Reference} cloudURL A reference that defines the URL for the cloud repository.
 * @param {Boolean} debug An optional flag that determines whether or not exceptions
 * will be logged to the error console.
 * @returns {Object} An object implementing the document repository interface.
 */
exports.repository = function(notary, cloudURL, debug) {
    debug = debug || false;
    var account = bali.NONE;

    // return a singleton object for the API
    return {

        /**
         * This function returns a string providing attributes about this repository.
         * 
         * @returns {String} A string providing attributes about this repository.
         */
        toString: function() {
            const catalog = bali.catalog({
                $account: account,
                $cloudURL: cloudURL
            });
            return catalog.toString();
        },

        /**
         *  This function initializes the repository and must be called prior to calling any of
         *  the other functions in the API. It can only be called once.
         */
        initializeAPI: async function() {
            try {
                account = await notary.getAccount();
                this.initializeAPI = function() {
                    const exception = bali.exception({
                        $module: '$CloudRepository',
                        $function: '$initializeAPI',
                        $exception: '$alreadyInitialized',
                        $account: account,
                        $cloudURL: cloudURL,
                        $message: bali.text('The cloud repository API has already been initialized.')
                    });
                    if (debug) console.error(exception.toString());
                    throw exception;
                };
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$initializeAPI',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to initialize the API.')
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
                const credentials = await generateCredentials(notary);
                const status = await sendRequest(credentials, '$certificateExists', cloudURL, 'HEAD', 'certificate', certificateId);
                return status;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$certificateExists',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting check to see if the certificate exists.')
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
                const credentials = await generateCredentials(notary);
                const certificate = await sendRequest(credentials, '$fetchCertificate', cloudURL, 'GET', 'certificate', certificateId);
                return certificate;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$fetchCertificate',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to fetch the certificate.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$createCertificate', cloudURL, 'POST', 'certificate', certificateId, certificate);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$createCertificate',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to create the certificate.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                const status = await sendRequest(credentials, '$draftExists', cloudURL, 'HEAD', 'draft', draftId);
                return status;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$draftExists',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting check to see if the draft exists.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                const draft = await sendRequest(credentials, '$fetchDraft', cloudURL, 'GET', 'draft', draftId);
                return draft;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$fetchDraft',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to fetch the draft.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function creates a new draft document in the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being created.
         * @param {String} draft The canonical source string for the draft document.
         */
        createDraft: async function(draftId, draft) {
            try {
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$createDraft', cloudURL, 'POST', 'draft', draftId, draft);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$createDraft',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to create the draft.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function updates an existing draft document in the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being updated.
         * @param {String} draft The canonical source string for the draft document.
         */
        updateDraft: async function(draftId, draft) {
            try {
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$updateDraft', cloudURL, 'PUT', 'draft', draftId, draft);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$updateDraft',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to update the draft.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$deleteDraft', cloudURL, 'DELETE', 'draft', draftId);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$deleteDraft',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to delete the draft.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                const status = await sendRequest(credentials, '$documentExists', cloudURL, 'HEAD', 'document', documentId);
                return status;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$documentExists',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting check to see if the document exists.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                const document = await sendRequest(credentials, '$fetchDocument', cloudURL, 'GET', 'document', documentId);
                return document;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$fetchDocument',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to fetch the document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$createDocument', cloudURL, 'POST', 'document', documentId, document);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$createDocument',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to create the document.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                const status = await sendRequest(credentials, '$typeExists', cloudURL, 'HEAD', 'type', typeId);
                return status;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$typeExists',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting check to see if the type exists.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                const type = await sendRequest(credentials, '$fetchType', cloudURL, 'GET', 'type', typeId);
                return type;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$fetchType',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to fetch the type.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
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
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$createType', cloudURL, 'POST', 'type', typeId, type);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$createType',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to create the type.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function checks to see whether or not a queue is associated with the
         * specified identifier.
         * 
         * @param {String} queueId The unique identifier (including version number) for
         * the queue being checked.
         * @returns {Boolean} Whether or not the queue exists.
         */
        queueExists: async function(queueId) {
            try {
                const credentials = await generateCredentials(notary);
                const status = await sendRequest(credentials, '$queueExists', cloudURL, 'HEAD', 'queue', queueId);
                return status;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$queueExists',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting check to see if the queue exists.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function creates a new queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue being created.
         */
        createQueue: async function(queueId) {
            try {
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$createQueue', cloudURL, 'POST', 'queue', queueId);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$createQueue',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to create the queue.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function deletes an existing queue (and all messages it contains) from the repository.
         * 
         * @param {String} queueId The unique identifier for the queue being deleted.
         */
        deleteQueue: async function(queueId) {
            try {
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$deleteQueue', cloudURL, 'DELETE', 'queue', queueId);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$deleteQueue',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to delete the queue.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function adds a new message onto the specified queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue.
         * @param {String} message The canonical source string for the message.
         */
        queueMessage: async function(queueId, message) {
            try {
                const credentials = await generateCredentials(notary);
                await sendRequest(credentials, '$queueMessage', cloudURL, 'PUT', 'queue', queueId, message);
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$queueMessage',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to queue the message.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        },

        /**
         * This function removes a message (at random) from the specified queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue.
         * @returns {String} The canonical source string for the message.
         */
        dequeueMessage: async function(queueId) {
            try {
                const credentials = await generateCredentials(notary);
                const message = await sendRequest(credentials, '$dequeueMessage', cloudURL, 'GET', 'queue', queueId);
                return message;
            } catch (cause) {
                const exception = bali.exception({
                    $module: '$CloudRepository',
                    $function: '$dequeueMessage',
                    $exception: '$unexpected',
                    $account: account,
                    $cloudURL: cloudURL,
                    $message: bali.text('An unexpected error occurred while attempting to dequeue the message.')
                }, cause);
                if (debug) console.error(exception.toString());
                throw exception;
            }
        }

    };
};


// PRIVATE FUNCTIONS

const generateCredentials = async function(notary) {
    const citation = await notary.getCitation();
    const credentials = await notary.notarizeDocument(citation);
    return credentials;
};


const sendRequest = async function(credentials, functionName, url, method, type, identifier, document) {

    // analyze the parameters
    switch (type) {
        case 'certificate':
            switch (method) {
                case 'HEAD':
                case 'GET':
                case 'POST':
                    break;
                default:
                    const exception = bali.exception({
                        $module: '$CloudRepository',
                        $function: functionName,
                        $exception: '$invalidParameter',
                        $method: bali.text(method.toString()),
                        $type: bali.text(type.toString()),
                        $message: bali.text('An invalid method and document type combination was specified.')
                    });
                    throw exception;
            }
            break;
        case 'draft':
            switch (method) {
                case 'HEAD':
                case 'GET':
                case 'PUT':
                case 'POST':
                case 'DELETE':
                    break;
                default:
                    const exception = bali.exception({
                        $module: '$CloudRepository',
                        $function: functionName,
                        $exception: '$invalidParameter',
                        $method: bali.text(method.toString()),
                        $type: bali.text(type.toString()),
                        $message: bali.text('An invalid method and document type combination was specified.')
                    });
                    throw exception;
            }
            break;
        case 'document':
            switch (method) {
                case 'HEAD':
                case 'GET':
                case 'POST':
                    break;
                default:
                    const exception = bali.exception({
                        $module: '$CloudRepository',
                        $function: functionName,
                        $exception: '$invalidParameter',
                        $method: bali.text(method.toString()),
                        $type: bali.text(type.toString()),
                        $message: bali.text('An invalid method and document type combination was specified.')
                    });
                    throw exception;
            }
            break;
        case 'type':
            switch (method) {
                case 'HEAD':
                case 'GET':
                case 'POST':
                    break;
                default:
                    const exception = bali.exception({
                        $module: '$CloudRepository',
                        $function: functionName,
                        $exception: '$invalidParameter',
                        $method: bali.text(method.toString()),
                        $type: bali.text(type.toString()),
                        $message: bali.text('An invalid method and document type combination was specified.')
                    });
                    throw exception;
            }
            break;
        case 'queue':
            switch (method) {
                case 'HEAD':
                case 'GET':
                case 'PUT':
                case 'POST':
                case 'DELETE':
                    break;
                default:
                    const exception = bali.exception({
                        $module: '$CloudRepository',
                        $function: functionName,
                        $exception: '$invalidParameter',
                        $method: bali.text(method.toString()),
                        $type: bali.text(type.toString()),
                        $message: bali.text('An invalid method and document type combination was specified.')
                    });
                    throw exception;
            }
            break;
        default:
            const exception = bali.exception({
                $module: '$CloudRepository',
                $function: functionName,
                $exception: '$invalidParameter',
                $parameter: bali.text(type.toString()),
                $message: bali.text('An invalid document type was specified.')
            });
            throw exception;
    }

    const fullURL = url.getValue().toString() + type + '/' + identifier;
    const options = {
        url: fullURL,
        method: method,
        //timeout: 1000,
        responseType: 'text',
        validateStatus: function (status) {
            return status < 400 || status === 404;  // only flag unexpected server errors
        },
        headers: {
            //'User-Agent': 'Bali Nebula API™ 1.0',
            'Nebula-Credentials': '"' + bali.format(credentials, -1) + '"'  // inlined quoted string
        }
    };

    const data = document ? document.toString() : undefined;
    if (data) {
        options.data = data;
        options.headers['Content-Type'] = 'application/bali';
        options.headers['Content-Length'] = data.length;
    }

    var result;
    const response = await axios(options).catch(function(error) {
        if (error.response) {
            // the server responded with an error status
            const exception = bali.exception({
                $module: '$CloudRepository',
                $function: functionName,
                $exception: '$invalidRequest',
                $url: bali.reference(options.url),
                $method: bali.text(method),
                $status: error.response.status,
                $details: bali.text(error.response.statusText),
                $message: bali.text('The request was rejected by the Bali Nebula™.')
            });
            throw exception;
        }

        if (error.request) {
            // the request was sent but no response was received
            const exception = bali.exception({
                $module: '$CloudRepository',
                $function: functionName,
                $exception: '$serverDown',
                $url: bali.reference(options.url),
                $method: bali.text(method),
                $status: error.request.status,
                $details: bali.text(error.request.statusText),
                $message: bali.text('The request received no response.')
            });
            throw exception;
        } 

        // the request could not be sent
        const exception = bali.exception({
            $module: '$CloudRepository',
            $function: functionName,
            $exception: '$malformedRequest',
            $url: bali.reference(options.url),
            $method: bali.text(options.method),
            $message: bali.text('The request was not formed correctly.')
        });
        throw exception;

    });

    switch (method) {
        case 'HEAD':
        case 'DELETE':
            result = (response.status !== 404);
            break;
        default:
            result = response.data || undefined;
    }

    return result;
};
