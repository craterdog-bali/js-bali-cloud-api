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
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.fetchDraft = function(draftId) {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.storeDraft = function(draftId, draft) {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.deleteDraft = function(draftId) {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.documentExists = function(documentId) {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.fetchDocument = function(documentId) {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.storeDocument = function(documentId, document) {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.queueMessage = function(queueId, messageId, message) {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};


CloudRepository.prototype.dequeueMessage = function(queueId) {
    throw new Error('REPOSITORY: The cloud based repository is not yet implemented.');
};
