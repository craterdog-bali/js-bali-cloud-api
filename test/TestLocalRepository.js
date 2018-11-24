/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

var mocha = require('mocha');
var expect = require('chai').expect;
var LocalRepository = require('../src/LocalRepository');
var repository = LocalRepository.api('test/config/');

var source =
    '[\n' +
    '    $date: <2018-04-01>\n' +
    '    $product: "Snickers Bar"\n' +
    '    $quantity: 10\n' +
    '    $price: 1.25(USD)\n' +
    '    $tax: 1.07(USD)\n' +
    '    $total: 13.57(USD)\n' +
    ']';

describe('Bali Nebula API™', function() {

    describe('Test LocalRepository', function() {

        it('should perform a draft document lifecycle', function() {
            var identifier = '#NZRRDAB94B4ZH0WDRT5N3TGX2ZTVMSV2v1.2.3';

            // store a new draft in the repository
            repository.storeDraft(identifier, source);

            // make sure the new draft exists in the repository
            var exists = repository.draftExists(identifier);
            expect(exists).is.true;  // jshint ignore:line

            // make sure the same document does not exist in the repository
            exists = repository.documentExists(identifier);
            expect(exists).is.false;  // jshint ignore:line

            // fetch the new draft from the repository
            var draft = repository.fetchDraft(identifier);
            expect(draft).to.equal(source);

            // delete the new draft from the repository
            repository.deleteDraft(identifier);

            // make sure the new draft no longer exists in the repository
            exists = repository.draftExists(identifier);
            expect(exists).is.false;  // jshint ignore:line

            // delete a non-existent draft from the repository
            repository.deleteDraft(identifier);
        });

        it('should perform a committed document lifecycle', function() {
            var identifier = '#YK4KPZHX2ZPVS0NNK2YH368XP7FR05Y9v3.4';

            // store a new document in the repository
            repository.storeDocument(identifier, source);

            // make sure the same draft does not exist in the repository
            exists = repository.draftExists(identifier);
            expect(exists).is.false;  // jshint ignore:line

            // make sure the new document exists in the repository
            var exists = repository.documentExists(identifier);
            expect(exists).is.true;  // jshint ignore:line

            // fetch the new document from the repository
            var document = repository.fetchDocument(identifier);
            expect(document).to.equal(source);

            // make sure the new document still exists in the repository
            exists = repository.documentExists(identifier);
            expect(exists).is.true;  // jshint ignore:line

            // attempt to store the same document in the repository
            expect(repository.storeDocument.bind(repository, identifier, source)).to.throw();
        });

        it('should perform a message queue lifecycle', function() {
            var queue = '#QSZNT8ABGSF75XR8FWHMYQCKTVK2WCPY';
            var message;

            // make sure the message queue is empty
            var none = repository.dequeueMessage(queue);
            expect(none).to.not.exist;  // jshint ignore:line

            // queue up some messages
            for (var i = 0; i < 3; i++) {
                // place a new message on the queue
                message = i.toString();
                repository.queueMessage(queue, i, message);

                // attempt to place the same message on the queue
                expect(repository.queueMessage.bind(repository, queue, message)).to.throw();
            }

            // dequeue the messages
            for (var j = 0; j < 3; j++) {
                // retrieve a message from the queue
                message = repository.dequeueMessage(queue);
            }

            // make sure the message queue is empty
            none = repository.dequeueMessage(queue);
            expect(none).to.not.exist;  // jshint ignore:line
        });

    });

});
