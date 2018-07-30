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
 * This class provides a local filesystem based document repository. It treats documents
 * as UTF-8 encoded strings. It can be used with the CloudAPI class for local testing.
 */
var fs = require('fs');


function LocalRepository(filesystem) {
    this.drafts = filesystem + '/drafts/';
    this.documents = filesystem + '/documents/';
    this.messages = filesystem + '/messages/';
    this.events = filesystem + '/events/';
    try {
        if (!fs.existsSync(filesystem)) fs.mkdirSync(filesystem);
        if (!fs.existsSync(this.drafts)) fs.mkdirSync(this.drafts);
        if (!fs.existsSync(this.documents)) fs.mkdirSync(this.documents);
        if (!fs.existsSync(this.messages)) fs.mkdirSync(this.messages);
        if (!fs.existsSync(this.events)) fs.mkdirSync(this.events);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible.');
    }
    return this;
}
LocalRepository.prototype.constructor = LocalRepository;
exports.LocalRepository = LocalRepository;


LocalRepository.prototype.draftExists = function(draftId) {
    console.log('draftExists(' + draftId + ')');
    try {
        return fs.existsSync(this.drafts + draftId);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible.');
    }
};


LocalRepository.prototype.fetchDraft = function(draftId) {
    console.log('fetchDraft(' + draftId + ')');
    var draft;
    try {
        if (fs.existsSync(this.drafts + draftId)) {
            draft = fs.readFileSync(this.drafts + draftId);
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible.');
    }
    return draft;
};


LocalRepository.prototype.storeDraft = function(draftId, draft) {
    console.log('storeDraft(' + draftId + ')');
    try {
        fs.writeFileSync(this.drafts + draftId, draft);  // TODO: add read-write options flags
    } catch (e) {
        throw new Error('REPOSITORY: The following draft could not be stored to the filesystem: ' + draftId);
    }
};


LocalRepository.prototype.deleteDraft = function(draftId) {
    console.log('deleteDraft(' + draftId + ')');
    try {
        if (fs.existsSync(this.drafts + draftId)) {
            fs.unlinkSync(this.drafts + draftId);
        }
    } catch (e) {
        throw new Error('REPOSITORY: The following draft could not be deleted from the filesystem: ' + draftId);
    }
};


LocalRepository.prototype.documentExists = function(documentId) {
    console.log('documentExists(' + documentId + ')');
    try {
        return fs.existsSync(this.documents + documentId);
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible.');
    }
};


LocalRepository.prototype.fetchDocument = function(documentId) {
    console.log('fetchDocument(' + documentId + ')');
    var document;
    try {
        if (fs.existsSync(this.documents + documentId)) {
            document = fs.readFileSync(this.documents + documentId);
        }
    } catch (e) {
        throw new Error('REPOSITORY: The filesystem is not currently accessible.');
    }
    return document;
};


LocalRepository.prototype.storeDocument = function(documentId, document) {
    console.log('storeDocument(' + documentId + ')');
    try {
        if (fs.existsSync(this.documents + documentId)) {
            throw new Error('REPOSITORY: The following document already exists in the filesystem: ' + documentId);
        }
        fs.writeFileSync(this.documents + documentId, document);  // TODO: add readonly options flags
    } catch (e) {
        throw new Error('REPOSITORY: The following document could not be stored in the filesystem: ' + documentId);
    }
};


LocalRepository.prototype.deleteDocument = function(documentId) {
    console.log('deleteDocument(' + documentId + ')');
    try {
        if (fs.existsSync(this.documents + documentId)) {
            fs.unlinkSync(this.documents + documentId);
        }
    } catch (e) {
        throw new Error('REPOSITORY: The following document could not be deleted from the filesystem: ' + documentId);
    }
};
