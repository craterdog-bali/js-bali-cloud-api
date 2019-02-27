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
 * @returns {Object} An object implementing the document repository interface.
 */
exports.repository = function(notary) {

    return {

        toString: function() {
            const catalog = bali.catalog({
                $citation: notary.getCitation(),
                $cloudURL: 'https://bali-nebula.net'
            });
            return catalog.toString();
        },

        certificateExists: function(certificateId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchCertificate: function(certificateId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeCertificate: function(certificateId, certificate) {
            return postDocument('storeCertificate', 'certificate', certificateId, certificate);
        },

        draftExists: function(draftId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchDraft: function(draftId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeDraft: function(draftId, draft) {
            return postDocument('storeDraft', 'draft', draftId, draft);
        },

        deleteDraft: function(draftId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        documentExists: function(documentId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchDocument: function(documentId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeDocument: function(documentId, document) {
            return postDocument('storeDocument', 'document', documentId, document);
        },

        typeExists: function(typeId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchType: function(typeId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeType: function(typeId, type) {
            return postDocument('storeType', 'type', typeId, type);
        },

        queueMessage: function(queue, message) {
            return postDocument('queueMessage', 'message', queue, message);
        },

        dequeueMessage: function(queue) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        }

    };
};


// PRIVATE FUNCTIONS

const keepAliveAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 256,
    maxFreeSockets: 128,
    timeout: 100
});


const getDocument = function(procedure, notary, type, identifier) {

    // analyze the parameters
    switch (type) {
        case 'certificate':
            break;
        case 'draft':
            break;
        case 'document':
            break;
        case 'type':
            break;
        case 'message':
            break;
        default:
            throw bali.exception({
                $module: '$CloudRepository',
                $procedure: procedure,
                $exception: '$invalidParameter',
                $parameter: type,
                $message: '"An invalid document type was specified."'
            });
    }
    if (!identifier || identifier.getTypeId() !== bali.types.TAG) {
        throw bali.exception({
            $module: '$CloudRepository',
            $procedure: procedure,
            $exception: '$invalidParameter',
            $parameter: identifier,
            $message: '"An invalid document identifier was specified."'
        });
    }

    const citation = notary.getCitation();
    const credentials = notary.notarizeDocument(citation);
    const options = {
        protocol: 'https',
        host: 'bali-nebula.net',
        port: 443,
        path: '/' + type + identifier,
        method: 'GET',
        agent: keepAliveAgent,
        timeout: 100,
        headers: {
            'Bali-Credentials': '"' + bali.format(credentials, -1) + '"'  // inlined quoted string
        }
    };

    var result = '';
    const request = http.request(options, function(response) {
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
            $type: type,
            $identifier: identifier,
            $credentials: credentials,
            $message: '"\nThe following communication error occurred:\n ' + error.message + '\n"'
        });
    });

    // write data to request body
    request.end();

    // process the resulting document
    try {
        return bali.parse(result);
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


const postDocument = function(procedure, type, identifier, document) {

    // analyze the parameters
    switch (type) {
        case 'certificate':
            break;
        case 'draft':
            break;
        case 'document':
            break;
        case 'type':
            break;
        case 'message':
            break;
        default:
            throw bali.exception({
                $module: '$CloudRepository',
                $procedure: procedure,
                $exception: '$invalidParameter',
                $parameter: type,
                $message: '"An invalid document type was specified."'
            });
    }
    if (!identifier || identifier.getTypeId() !== bali.types.TAG) {
        throw bali.exception({
            $module: '$CloudRepository',
            $procedure: procedure,
            $exception: '$invalidParameter',
            $parameter: identifier,
            $message: '"An invalid document identifier was specified."'
        });
    }
    if (!document || document.getTypeId() !== bali.types.CATALOG) {
        throw bali.exception({
            $module: '$CloudRepository',
            $procedure: procedure,
            $exception: '$invalidParameter',
            $parameter: document,
            $message: '"An invalid document was specified."'
        });
    }

    const data = document.toString();
    const options = {
        protocol: 'https',
        host: 'bali-nebula.net',
        port: 443,
        path: '/' + type + identifier,
        method: 'POST',
        agent: keepAliveAgent,
        timeout: 100,
        headers: {
            'Content-Type': 'application/bali',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    var result = '';
    const request = http.request(options, function(response) {
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
            $type: type,
            $identifier: identifier,
            $document: document,
            $message: '"\nThe following communication error occurred:\n ' + error.message + '\n"'
        });
    });

    // write data to request body
    request.write(data);
    request.end();

    // process the resulting document
    try {
        return bali.parse(result);
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
