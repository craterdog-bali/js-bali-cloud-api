/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

var LocalRepository = require('../LocalRepository').LocalRepository;
var mocha = require('mocha');
var expect = require('chai').expect;

var repository = new LocalRepository('test/repository');

var source = 'foobar';

describe('Bali Cloud API™', function() {

    describe('Test draft access.', function() {

        it('should perform a draft document lifecycle', function() {
            var draftId = 'draftId';

            // store a new draft in the repository
            repository.storeDraft(draftId, source);

            // fetch the new draft from the repository
            var draft = repository.fetchDraft(draftId);
            expect(draft).to.equal(source);

            // delete the new draft from the repository
            repository.deleteDraft(draftId);

            // make sure the new draft no longer exists in the repository
            var exists = repository.draftExists(draftId);
            expect(exists).is.false;  // jshint ignore:line

            // delete a non-existent draft from the repository
            repository.deleteDraft(draftId);
        });

        it('should perform a committed document lifecycle', function() {
            var documentId = 'documentId';

            // store a new document in the repository
            repository.storeDocument(documentId, source);

            // fetch the new document from the repository
            var document = repository.fetchDocument(documentId);
            expect(document).to.equal(source);

            // make sure the new document still exists in the repository
            var exists = repository.documentExists(documentId);
            expect(exists).is.true;  // jshint ignore:line

            // attempt to store the same document in the repository
            expect(repository.storeDocument.bind(documentId, source)).to.throw();
        });

        it('should perform a message queue lifecycle', function() {
            var queueId = 'queueId';

            // make sure the message queue is empty
            var message = repository.dequeueMessage(queueId);
            expect(message).to.not.exist;  // jshint ignore:line

            // queue up some messages
            for (var i = 0; i < 3; i++) {
                // place a new message on the queue
                var messageId = 'messageId' + i;
                repository.queueMessage(queueId, messageId, source);

                // attempt to place the same message on the queue
                expect(repository.queueMessage.bind(queueId, messageId, source)).to.throw();
            }

            // dequeue the messages
            for (var j = 0; j < 3; j++) {
                // retrieve a message from the queue
                message = repository.dequeueMessage(queueId);
                expect(message).to.equal(source);
            }

            // make sure the message queue is empty
            message = repository.dequeueMessage(queueId);
            expect(message).to.not.exist;  // jshint ignore:line
        });

    });

});
