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
 * This class provides a AWS cloud based document repository. It treats documents
 * as UTF-8 encoded strings. It can be used with the CloudAPI class for production.
 */


function CloudRepository() {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
}
CloudRepository.prototype.constructor = CloudRepository;
exports.CloudRepository = CloudRepository;


CloudRepository.prototype.draftExists = function(draftId) {
    console.log('draftExists(' + draftId + ')');
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.fetchDraft = function(draftId) {
    console.log('fetchDraft(' + draftId + ')');
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.storeDraft = function(draftId, draft) {
    console.log('storeDraft(' + draftId + ')');
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.deleteDraft = function(draftId) {
    console.log('deleteDraft(' + draftId + ')');
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.documentExists = function(documentId) {
    console.log('documentExists(' + documentId + ')');
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.fetchDocument = function(documentId) {
    console.log('fetchDocument(' + documentId + ')');
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.storeDocument = function(documentId, document) {
    console.log('storeDocument(' + documentId + ')');
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.deleteDocument = function(documentId) {
    console.log('deleteDocument(' + documentId + ')');
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};
