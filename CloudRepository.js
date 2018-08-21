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
 * This module defines a singleton that provides a AWS cloud based document
 * repository. It treats documents as UTF-8 encoded strings.
 */


/**
 * This function returns a reference to the cloud repository.
 * 
 * @returns {Object} An object containing the functions that the repository supports.
 */
exports.repository = function() {

    return {

        toString: function() {
            // TODO: print out the AWS cloud account information for this client
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        certificateExists: function(tag, version) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchCertificate: function(tag, version) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeCertificate: function(tag, version, certificate) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        draftExists: function(tag, version) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchDraft: function(tag, version) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeDraft: function(tag, version, draft) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        deleteDraft: function(tag, version) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        documentExists: function(tag, version) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        fetchDocument: function(tag, version) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        storeDocument: function(tag, version, document) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        queueMessage: function(queue, tag, message) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        },

        dequeueMessage: function(queue) {
            throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
        }

    };
};
