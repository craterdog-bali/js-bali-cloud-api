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
 * @param {String|URL} cloudURL An object that defines the URL for the cloud repository.
 * @returns {Object} An object implementing the document repository interface.
 */
exports.repository = function(notary, cloudURL) {

    var account;

    return {

        toString: function() {
            const catalog = bali.catalog({
                $account: account,
                $cloudURL: cloudURL
            });
            return catalog.toString();
        },

        initializeAPI: async function() {
            account = await notary.getAccount();
            this.initializeAPI = function() {
                throw bali.exception({
                    $module: '$CloudRepository',
                    $procedure: '$initializeAPI',
                    $exception: '$alreadyInitialized',
                    $message: bali.text('The local repository API has already been initialized.')
                });
            };
        },

        certificateExists: async function(certificateId) {
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$certificateExists', cloudURL, 'HEAD', 'certificate', certificateId);
            return status;
        },

        fetchCertificate: async function(certificateId) {
            const credentials = await generateCredentials(notary);
            const certificate = await sendRequest(credentials, '$fetchCertificate', cloudURL, 'GET', 'certificate', certificateId);
            return certificate;
        },

        createCertificate: async function(certificateId, certificate) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createCertificate', cloudURL, 'POST', 'certificate', certificateId, certificate);
        },

        draftExists: async function(draftId) {
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$draftExists', cloudURL, 'HEAD', 'draft', draftId);
            return status;
        },

        fetchDraft: async function(draftId) {
            const credentials = await generateCredentials(notary);
            const draft = await sendRequest(credentials, '$fetchDraft', cloudURL, 'GET', 'draft', draftId);
            return draft;
        },

        createDraft: async function(draftId, draft) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createDraft', cloudURL, 'POST', 'draft', draftId, draft);
        },

        updateDraft: async function(draftId, draft) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$updateDraft', cloudURL, 'PUT', 'draft', draftId, draft);
        },

        deleteDraft: async function(draftId) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$deleteDraft', cloudURL, 'DELETE', 'draft', draftId);
        },

        documentExists: async function(documentId) {
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$documentExists', cloudURL, 'HEAD', 'document', documentId);
            return status;
        },

        fetchDocument: async function(documentId) {
            const credentials = await generateCredentials(notary);
            const document = await sendRequest(credentials, '$fetchDocument', cloudURL, 'GET', 'document', documentId);
            return document;
        },

        createDocument: async function(documentId, document) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createDocument', cloudURL, 'POST', 'document', documentId, document);
        },

        typeExists: async function(typeId) {
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$typeExists', cloudURL, 'HEAD', 'type', typeId);
            return status;
        },

        fetchType: async function(typeId) {
            const credentials = await generateCredentials(notary);
            const type = await sendRequest(credentials, '$fetchType', cloudURL, 'GET', 'type', typeId);
            return type;
        },

        createType: async function(typeId, type) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createType', cloudURL, 'POST', 'type', typeId, type);
        },

        queueExists: async function(queueId) {
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$queueExists', cloudURL, 'HEAD', 'queue', queueId);
            return status;
        },

        createQueue: async function(queueId) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createQueue', cloudURL, 'POST', 'queue', queueId);
        },

        deleteQueue: async function(queueId) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$deleteQueue', cloudURL, 'DELETE', 'queue', queueId);
        },

        queueMessage: async function(queueId, message) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$queueMessage', cloudURL, 'PUT', 'queue', queueId, message);
        },

        dequeueMessage: async function(queueId) {
            const credentials = await generateCredentials(notary);
            const message = await sendRequest(credentials, '$dequeueMessage', cloudURL, 'GET', 'queue', queueId);
            return message;
        }

    };
};


// PRIVATE FUNCTIONS

const generateCredentials = async function(notary) {
    const citation = await notary.getCitation();
    const credentials = await notary.notarizeDocument(citation);
    return credentials;
};


const sendRequest = async function(credentials, procedure, url, method, type, identifier, document) {

    // analyze the parameters
    switch (type) {
        case 'certificate':
            switch (method) {
                case 'HEAD':
                case 'GET':
                case 'POST':
                    break;
                default:
                    throw bali.exception({
                        $module: '$CloudRepository',
                        $procedure: procedure,
                        $exception: '$invalidParameter',
                        $method: '"\n' + method.toString() + '\n"',
                        $type: '"\n' + type.toString() + '\n"',
                        $message: '"An invalid method and document type combination was specified."'
                    });
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
                    throw bali.exception({
                        $module: '$CloudRepository',
                        $procedure: procedure,
                        $exception: '$invalidParameter',
                        $method: '"\n' + method.toString() + '\n"',
                        $type: '"\n' + type.toString() + '\n"',
                        $message: '"An invalid method and document type combination was specified."'
                    });
            }
            break;
        case 'document':
            switch (method) {
                case 'HEAD':
                case 'GET':
                case 'POST':
                    break;
                default:
                    throw bali.exception({
                        $module: '$CloudRepository',
                        $procedure: procedure,
                        $exception: '$invalidParameter',
                        $method: '"\n' + method.toString() + '\n"',
                        $type: '"\n' + type.toString() + '\n"',
                        $message: '"An invalid method and document type combination was specified."'
                    });
            }
            break;
        case 'type':
            switch (method) {
                case 'HEAD':
                case 'GET':
                case 'POST':
                    break;
                default:
                    throw bali.exception({
                        $module: '$CloudRepository',
                        $procedure: procedure,
                        $exception: '$invalidParameter',
                        $method: '"\n' + method.toString() + '\n"',
                        $type: '"\n' + type.toString() + '\n"',
                        $message: '"An invalid method and document type combination was specified."'
                    });
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
                    throw bali.exception({
                        $module: '$CloudRepository',
                        $procedure: procedure,
                        $exception: '$invalidParameter',
                        $method: '"\n' + method.toString() + '\n"',
                        $type: '"\n' + type.toString() + '\n"',
                        $message: '"An invalid method and document type combination was specified."'
                    });
            }
            break;
        default:
            throw bali.exception({
                $module: '$CloudRepository',
                $procedure: procedure,
                $exception: '$invalidParameter',
                $parameter: '"\n' + type.toString() + '\n"',
                $message: '"An invalid document type was specified."'
            });
    }

    const options = {
        url: url + '/' + type + '/' + identifier,
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
            throw bali.exception({
                $module: '$CloudRepository',
                $procedure: procedure,
                $exception: '$invalidRequest',
                $url: '<' + options.url + '>',
                $method: '"' + method + '"',
                $status: error.response.status,
                $details: '"' + error.response.statusText + '"',
                $message: '"The request was rejected by the Bali Nebula™."'
            });
        }

        if (error.request) {
            // the request was sent but no response was received
            throw bali.exception({
                $module: '$CloudRepository',
                $procedure: procedure,
                $exception: '$serverDown',
                $url: '<' + options.url + '>',
                $method: '"' + method + '"',
                $status: error.request.status,
                $details: '"' + error.request.statusText + '"',
                $message: '"The request received no response."'
            });
        } 

        // the request could not be sent
        throw bali.exception({
            $module: '$CloudRepository',
            $procedure: procedure,
            $exception: '$malformedRequest',
            $url: '<' + options.url + '>',
            $method: '"' + options.method + '"',
            $message: '"The request was not formed correctly."'
        });

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
