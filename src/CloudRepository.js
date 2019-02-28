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
const http = require('http');
/**
 * This function returns an object that implements the API for the AWS cloud document
 * repository.
 * 
 * @param {Object} notary An object that implements the API for the digital notary.
 * @param {String|URL} cloudURL An object that defines the URL for the cloud repository.
 * @returns {Object} An object implementing the document repository interface.
 */
exports.repository = function(notary, cloudURL) {

    return {

        toString: function() {
            const catalog = bali.catalog({
                $citation: notary.getCitation(),
                $cloudURL: cloudURL
            });
            return catalog.toString();
        },

        certificateExists: function(certificateId) {
            const credentials = generateCredentials(notary);
            const status = sendRequest(credentials, 'certificateExists', cloudURL, 'HEAD', 'certificate', certificateId);
            return status;
        },

        fetchCertificate: function(certificateId) {
            const credentials = generateCredentials(notary);
            const certificate = sendRequest(credentials, 'fetchCertificate', cloudURL, 'GET', 'certificate', certificateId);
            return certificate;
        },

        storeCertificate: function(certificateId, certificate) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'storeCertificate', cloudURL, 'POST', 'certificate', certificateId, certificate);
        },

        draftExists: function(draftId) {
            const credentials = generateCredentials(notary);
            const status = sendRequest(credentials, 'draftExists', cloudURL, 'HEAD', 'draft', draftId);
            return status;
        },

        fetchDraft: function(draftId) {
            const credentials = generateCredentials(notary);
            const draft = sendRequest(credentials, 'fetchDraft', cloudURL, 'GET', 'draft', draftId);
            return draft;
        },

        storeDraft: function(draftId, draft) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'storeDraft', cloudURL, 'POST', 'draft', draftId, draft);
        },

        deleteDraft: function(draftId) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'deleteDraft', cloudURL, 'DELETE', 'draft', draftId);
        },

        documentExists: function(documentId) {
            const credentials = generateCredentials(notary);
            const status = sendRequest(credentials, 'documentExists', cloudURL, 'HEAD', 'document', documentId);
            return status;
        },

        fetchDocument: function(documentId) {
            const credentials = generateCredentials(notary);
            const document = sendRequest(credentials, 'fetchDocument', cloudURL, 'GET', 'document', documentId);
            return document;
        },

        storeDocument: function(documentId, document) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'storeDocument', cloudURL, 'POST', 'document', documentId, document);
        },

        typeExists: function(typeId) {
            const credentials = generateCredentials(notary);
            const status = sendRequest(credentials, 'typeExists', cloudURL, 'HEAD', 'type', typeId);
            return status;
        },

        fetchType: function(typeId) {
            const credentials = generateCredentials(notary);
            const type = sendRequest(credentials, 'fetchType', cloudURL, 'GET', 'type', typeId);
            return type;
        },

        storeType: function(typeId, type) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'storeType', cloudURL, 'POST', 'type', typeId, type);
        },

        queueExists: function(queueId) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'queueExists', cloudURL, 'HEAD', 'queue', queueId);
        },

        createQueue: function(queueId) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'createQueue', cloudURL, 'POST', 'queue', queueId);
        },

        deleteQueue: function(queueId) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'deleteQueue', cloudURL, 'DELETE', 'queue', queueId);
        },

        queueMessage: function(queueId, message) {
            const credentials = generateCredentials(notary);
            sendRequest(credentials, 'queueMessage', cloudURL, 'PUT', 'queue', queueId, message);
        },

        dequeueMessage: function(queueId) {
            const credentials = generateCredentials(notary);
            const message = sendRequest(credentials, 'dequeueMessage', cloudURL, 'GET', 'queue', queueId);
            return message;
        }

    };
};


// PRIVATE FUNCTIONS

const generateCredentials = function(notary) {
    const citation = notary.getCitation();
    const credentials = notary.notarizeDocument(citation);
    return credentials;
};


const keepAliveAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 256,
    maxFreeSockets: 128,
    timeout: 100
});


const sendRequest = function(credentials, procedure, url, method, type, identifier, document) {

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
    if (!identifier || identifier.getTypeId() !== bali.types.TAG) {
        throw bali.exception({
            $module: '$CloudRepository',
            $procedure: procedure,
            $exception: '$invalidParameter',
            $parameter: '"\n' + identifier.toString() + '\n"',
            $message: '"An invalid document identifier was specified."'
        });
    }
    if (document && document.getTypeId() !== bali.types.CATALOG) {
        throw bali.exception({
            $module: '$CloudRepository',
            $procedure: procedure,
            $exception: '$invalidParameter',
            $parameter: '"\n' + document.toString() + '\n"',
            $message: '"An invalid document was specified."'
        });
    }

    const options = {
        path: '/' + type + '/' + identifier,
        method: method,
        agent: keepAliveAgent,
        timeout: 100,
        headers: {
            'Nebula-Credentials': '"' + bali.format(credentials, -1) + '"'  // inlined quoted string
        }
    };

    const data = document ? document.toString() : undefined;
    if (data) {
        options.headers['Content-Type'] = 'application/bali';
        options.headers['Content-Length'] = data.length;
    }

    var status = false;
    var result = '';
    const request = http.request(url, options, function(response) {
        response.setEncoding('utf8');
        response.on('data', function(chunk) {
            result += chunk;
        });
    });

    request.on('error', function(error) {
        throw bali.exception({
            $module: '$CloudRepository',
            $procedure: procedure,
            $exception: '$remoteRequest',
            $credentials: credentials,
            $type: type,
            $identifier: identifier,
            $message: '"\nThe following communication error occurred:\n ' + error.message + '\n"'
        });
    });

    request.on('information', function(response) {
        status = response.statusCode === 200;
    });

    // send the request
    if (data) request.write(data);
    request.end();

    // process the result
    try {
        if (result) return bali.parse(result);
        return status;
    } catch (e) {
        throw bali.exception({
            $module: '$CloudRepository',
            $procedure: procedure,
            $exception: '$invalidResponse',
            $response: '"\n' + result + '\n"',
            $message: '"The response is not a valid component."'
        });
    }
};
