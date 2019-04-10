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
 * will be logged to the error console.
 * @returns {Object} An object implementing the document repository interface.
 */
exports.repository = function(notary, cloudURL) {
    const accountId = notary.getAccountId();

    // return a singleton object for the API
    return {

        /**
         * This function returns a string providing attributes about this repository.
         * 
         * @returns {String} A string providing attributes about this repository.
         */
        toString: function() {
            const catalog = bali.catalog({
                $module: '$CloudRepository',
                $accountId: accountId,
                $url: cloudURL
            });
            return catalog.toString();
        },

        /**
         * This function returns a reference to this document repository.
         * 
         * @returns {Reference} A reference to this document repository.
         */
        getURL: function() {
            return cloudURL;
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
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$certificateExists', cloudURL, 'HEAD', 'certificate', certificateId);
            return status;
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
            const credentials = await generateCredentials(notary);
            const certificate = await sendRequest(credentials, '$fetchCertificate', cloudURL, 'GET', 'certificate', certificateId);
            return certificate;
        },

        /**
         * This function creates a new certificate in the repository.
         * 
         * @param {String} certificateId The unique identifier (including version number) for
         * the certificate being created.
         * @param {String} certificate The canonical source string for the certificate.
         */
        createCertificate: async function(certificateId, certificate) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createCertificate', cloudURL, 'POST', 'certificate', certificateId, certificate);
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
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$draftExists', cloudURL, 'HEAD', 'draft', draftId);
            return status;
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
            const credentials = await generateCredentials(notary);
            const draft = await sendRequest(credentials, '$fetchDraft', cloudURL, 'GET', 'draft', draftId);
            return draft;
        },

        /**
         * This function saves a draft document in the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being created.
         * @param {String} draft The canonical source string for the draft document.
         */
        saveDraft: async function(draftId, draft) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$saveDraft', cloudURL, 'PUT', 'draft', draftId, draft);
        },

        /**
         * This function attempts to delete the specified draft document from the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being deleted.
         */
        deleteDraft: async function(draftId) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$deleteDraft', cloudURL, 'DELETE', 'draft', draftId);
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
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$documentExists', cloudURL, 'HEAD', 'document', documentId);
            return status;
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
            const credentials = await generateCredentials(notary);
            const document = await sendRequest(credentials, '$fetchDocument', cloudURL, 'GET', 'document', documentId);
            return document;
        },

        /**
         * This function creates a new document in the repository.
         * 
         * @param {String} documentId The unique identifier (including version number) for
         * the document being created.
         * @param {String} document The canonical source string for the document.
         */
        createDocument: async function(documentId, document) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createDocument', cloudURL, 'POST', 'document', documentId, document);
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
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$typeExists', cloudURL, 'HEAD', 'type', typeId);
            return status;
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
            const credentials = await generateCredentials(notary);
            const type = await sendRequest(credentials, '$fetchType', cloudURL, 'GET', 'type', typeId);
            return type;
        },

        /**
         * This function creates a new type in the repository.
         * 
         * @param {String} typeId The unique identifier (including version number) for
         * the type being created.
         * @param {String} type The canonical source string for the type.
         */
        createType: async function(typeId, type) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createType', cloudURL, 'POST', 'type', typeId, type);
        },

        /**
         * This function adds a new message onto the specified queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue.
         * @param {String} message The canonical source string for the message.
         */
        queueMessage: async function(queueId, message) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$queueMessage', cloudURL, 'PUT', 'queue', queueId, message);
        },

        /**
         * This function removes a message (at random) from the specified queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue.
         * @returns {String} The canonical source string for the message.
         */
        dequeueMessage: async function(queueId) {
            const credentials = await generateCredentials(notary);
            const message = await sendRequest(credentials, '$dequeueMessage', cloudURL, 'GET', 'queue', queueId);
            return message;
        }

    };
};


// PRIVATE FUNCTIONS

/**
 * This function generates a set of signed credentials for the client making a request on
 * the cloud repository. The credentials can be used by the cloud repository to authenticate
 * the client and verify their permissions.
 * 
 * @param {Object} notary An object that implements the API for the digital notary.
 * @returns {Catalog} The newly generated credentials.
 */
const generateCredentials = async function(notary) {
    const citation = await notary.getCitation();
    const document = bali.duplicate(citation);
    const parameters = document.getParameters();
    parameters.setParameter('$tag', bali.tag());
    parameters.setParameter('$version', bali.version());
    parameters.setParameter('$permissions', bali.parse('/bali/permissions/Private/v1'));
    parameters.setParameter('$previous', bali.NONE);
    const credentials = await notary.signComponent(document);
    return credentials;
};


/**
 * This function sends a RESTful web request to the web service specified by the cloudURL,
 * method, type and identifier. If a document is included it is sent as the body of the
 * request. The result that is returned by the web service is returned from this function.
 * 
 * @param {Catalog} credentials The signed credentials for the client making the request. 
 * @param {String} functionName The name of the API function sending the request.
 * @param {Reference} cloudURL A reference containing the URL of the web service.
 * @param {String} method The HTTP method type of the request.
 * @param {String} type The type of resource being acted upon.
 * @param {String} identifier An identifier for the specific resource being acted upon.
 * @param {Catalog} document An optional signed document to be passed to the web service.
 * @returns {Boolean|Catalog} The result of the request.
 */
const sendRequest = async function(credentials, functionName, cloudURL, method, type, identifier, document) {

    // setup the request URL and options
    const fullURL = cloudURL.getValue().toString() + type + '/' + identifier;
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

    // add headers for the data (if applicable)
    const data = document ? document.toString() : undefined;
    if (data) {
        options.data = data;
        options.headers['Content-Type'] = 'application/bali';
        options.headers['Content-Length'] = data.length;
    }

    // send the request
    try {
        const response = await axios(options);
        var result;
        switch (method) {
            case 'HEAD':
            case 'DELETE':
                result = (response.status !== 404);
                break;
            default:
                result = response.data || undefined;
            }
        return result;
    } catch (cause) {
        if (cause.response) {
            // the server responded with an error status
            const exception = bali.exception({
                $module: '$CloudRepository',
                $function: functionName,
                $exception: '$invalidRequest',
                $url: bali.reference(options.url),
                $method: bali.text(method),
                $status: cause.response.status,
                $details: bali.text(cause.response.statusText),
                $text: bali.text('The request was rejected by the Bali Nebula™.')
            });
            throw exception;
        }
        if (cause.request) {
            // the request was sent but no response was received
            const exception = bali.exception({
                $module: '$CloudRepository',
                $function: functionName,
                $exception: '$serverDown',
                $url: bali.reference(options.url),
                $method: bali.text(method),
                $status: cause.request.status,
                $details: bali.text(cause.request.statusText),
                $text: bali.text('The request received no response.')
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
            $text: bali.text('The request was not formed correctly.')
        });
        throw exception;
    }
};
