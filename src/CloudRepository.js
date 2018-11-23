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


/**
 * This function returns an object that implements the API for the AWS cloud document
 * repository.
 * 
 * @returns {Object} An object containing the functions that the repository supports.
 */
exports.api = function() {

    return {

        toString: function() {
            // TODO: print out the AWS cloud account information for this client
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        certificateExists: function(certificateId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchCertificate: function(certificateId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeCertificate: function(certificateId, certificate) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        draftExists: function(draftId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchDraft: function(draftId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeDraft: function(draftId, draft) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
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
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        typeExists: function(typeId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchType: function(typeId) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeType: function(typeId, type) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        queueMessage: function(queue, messageId, message) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        dequeueMessage: function(queue) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        }

    };
};
