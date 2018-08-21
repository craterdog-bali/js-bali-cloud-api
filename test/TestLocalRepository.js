/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

var LocalRepository = require('../LocalRepository');
var mocha = require('mocha');
var expect = require('chai').expect;

var repository = LocalRepository.repository('test/config/');

var source = 'foobar';

describe('Bali Cloud API™', function() {

    describe('Test LocalRepository', function() {

        it('should perform a draft document lifecycle', function() {
            var tag = '#NZRRDAB94B4ZH0WDRT5N3TGX2ZTVMSV2';
            var version = 'v1.2.3';

            // store a new draft in the repository
            repository.storeDraft(tag, version, source);

            // make sure the new draft exists in the repository
            var exists = repository.draftExists(tag, version);
            expect(exists).is.true;  // jshint ignore:line

            // make sure the same document does not exist in the repository
            exists = repository.documentExists(tag, version);
            expect(exists).is.false;  // jshint ignore:line

            // fetch the new draft from the repository
            var draft = repository.fetchDraft(tag, version);
            expect(draft).to.equal(source);

            // delete the new draft from the repository
            repository.deleteDraft(tag, version);

            // make sure the new draft no longer exists in the repository
            exists = repository.draftExists(tag, version);
            expect(exists).is.false;  // jshint ignore:line

            // delete a non-existent draft from the repository
            repository.deleteDraft(tag, version);
        });

        it('should perform a committed document lifecycle', function() {
            var tag = '#YK4KPZHX2ZPVS0NNK2YH368XP7FR05Y9';
            var version = 'v3.4';

            // store a new document in the repository
            repository.storeDocument(tag, version, source);

            // make sure the same draft does not exist in the repository
            exists = repository.draftExists(tag, version);
            expect(exists).is.false;  // jshint ignore:line

            // make sure the new document exists in the repository
            var exists = repository.documentExists(tag, version);
            expect(exists).is.true;  // jshint ignore:line

            // fetch the new document from the repository
            var document = repository.fetchDocument(tag, version);
            expect(document).to.equal(source);

            // make sure the new document still exists in the repository
            exists = repository.documentExists(tag, version);
            expect(exists).is.true;  // jshint ignore:line

            // attempt to store the same document in the repository
            expect(repository.storeDocument.bind(repository, tag, version, source)).to.throw();
        });

        it('should perform a message queue lifecycle', function() {
            var queue = 'queueId';

            // make sure the message queue is empty
            var message = repository.dequeueMessage(queue);
            expect(message).to.not.exist;  // jshint ignore:line

            // queue up some messages
            for (var i = 0; i < 3; i++) {
                // place a new message on the queue
                var tag = '#RCF5A7QYVNXHKSW449QTY3HJB63JG8DP' + i;
                repository.queueMessage(queue, tag, source);

                // attempt to place the same message on the queue
                expect(repository.queueMessage.bind(repository, queue, tag, source)).to.throw();
            }

            // dequeue the messages
            for (var j = 0; j < 3; j++) {
                // retrieve a message from the queue
                message = repository.dequeueMessage(queue);
                expect(message).to.equal(source);
            }

            // make sure the message queue is empty
            message = repository.dequeueMessage(queue);
            expect(message).to.not.exist;  // jshint ignore:line
        });

    });

});
