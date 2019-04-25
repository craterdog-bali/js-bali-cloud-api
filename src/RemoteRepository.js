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
 * @param {Reference} url A reference that defines the URL for the cloud repository.
 * will be logged to the error console.
 * @returns {Object} An object implementing the document repository interface.
 */
exports.repository = function(notary, url) {
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
                $module: '/bali/repositories/RemoteRepository',
                $accountId: accountId,
                $url: url
            });
            return catalog.toString();
        },

        /**
         * This function returns a reference to this document repository.
         * 
         * @returns {Reference} A reference to this document repository.
         */
        getURL: function() {
            return url;
        },

        /**
         * This function checks to see whether or not a document citation is associated
         * with the specified name.
         * 
         * @param {String} name The unique name for the document citation being checked.
         * @returns {Boolean} Whether or not the document citation exists.
         */
        citationExists: async function(name) {
            const credentials = await generateCredentials(notary);
            const status = await sendRequest(credentials, '$citationExists', url, 'HEAD', 'citation', name);
            return status;
        },

        /**
         * This function attempts to retrieve a document citation from the repository for
         * the specified name.
         * 
         * @param {String} name The unique name for the document citation being fetched.
         * @returns {String} The canonical source string for the document citation, or
         * <code>undefined</code> if it doesn't exist.
         */
        fetchCitation: async function(name) {
            const credentials = await generateCredentials(notary);
            const citation = await sendRequest(credentials, '$fetchCitation', url, 'GET', 'citation', name);
            return citation;
        },

        /**
         * This function associates a new name with the specified document citation in
         * the repository.
         * 
         * @param {String} name The unique name for the specified document citation.
         * @param {String} citation The canonical source string for the document citation.
         */
        createCitation: async function(name, citation) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$createCitation', url, 'POST', 'citation', name, citation);
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
            const status = await sendRequest(credentials, '$draftExists', url, 'HEAD', 'draft', draftId);
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
            const draft = await sendRequest(credentials, '$fetchDraft', url, 'GET', 'draft', draftId);
            return draft;
        },

        /**
         * This function saves a draft document in the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being saved.
         * @param {String} draft The canonical source string for the draft document.
         */
        saveDraft: async function(draftId, draft) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$saveDraft', url, 'PUT', 'draft', draftId, draft);
        },

        /**
         * This function attempts to delete the specified draft document from the repository.
         * 
         * @param {String} draftId The unique identifier (including version number) for
         * the draft document being deleted.
         */
        deleteDraft: async function(draftId) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$deleteDraft', url, 'DELETE', 'draft', draftId);
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
            const status = await sendRequest(credentials, '$documentExists', url, 'HEAD', 'document', documentId);
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
            const document = await sendRequest(credentials, '$fetchDocument', url, 'GET', 'document', documentId);
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
            await sendRequest(credentials, '$createDocument', url, 'POST', 'document', documentId, document);
        },

        /**
         * This function adds a new message onto the specified queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue.
         * @param {String} message The canonical source string for the message.
         */
        queueMessage: async function(queueId, message) {
            const credentials = await generateCredentials(notary);
            await sendRequest(credentials, '$queueMessage', url, 'PUT', 'queue', queueId, message);
        },

        /**
         * This function removes a message (at random) from the specified queue in the repository.
         * 
         * @param {String} queueId The unique identifier for the queue.
         * @returns {String} The canonical source string for the message.
         */
        dequeueMessage: async function(queueId) {
            const credentials = await generateCredentials(notary);
            const message = await sendRequest(credentials, '$dequeueMessage', url, 'GET', 'queue', queueId);
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
    parameters.setParameter('$permissions', bali.parse('/bali/permissions/private/v1'));
    parameters.setParameter('$previous', bali.NONE);
    const credentials = await notary.signComponent(document);
    return credentials;
};


/**
 * This function sends a RESTful web request to the web service specified by the url,
 * method, type and identifier. If a document is included it is sent as the body of the
 * request. The result that is returned by the web service is returned from this function.
 * 
 * @param {Catalog} credentials The signed credentials for the client making the request. 
 * @param {String} functionName The name of the API function sending the request.
 * @param {Reference} url A reference containing the URL of the web service.
 * @param {String} method The HTTP method type of the request.
 * @param {String} type The type of resource being acted upon.
 * @param {String} identifier An identifier for the specific resource being acted upon.
 * @param {Catalog} document An optional signed document to be passed to the web service.
 * @returns {Boolean|Catalog} The result of the request.
 */
const sendRequest = async function(credentials, functionName, url, method, type, identifier, document) {

    // setup the request URL and options
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
                $module: '/bali/repositories/RemoteRepository',
                $procedure: functionName,
                $exception: '$invalidRequest',
                $url: bali.reference(options.url),
                $method: bali.text(method),
                $status: cause.response.status,
                $details: bali.text(cause.response.statusText),
                $text: bali.text('The request was rejected by the Bali Nebula™.')
            });
            console.log('exception: ' + exception);
            throw exception;
        }
        if (cause.request) {
            // the request was sent but no response was received
            const exception = bali.exception({
                $module: '/bali/repositories/RemoteRepository',
                $procedure: functionName,
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
            $module: '/bali/repositories/RemoteRepository',
            $procedure: functionName,
            $exception: '$malformedRequest',
            $url: bali.reference(options.url),
            $method: bali.text(options.method),
            $text: bali.text('The request was not formed correctly.')
        });
        throw exception;
    }
};
