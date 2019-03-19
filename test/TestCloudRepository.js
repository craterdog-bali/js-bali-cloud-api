/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const debug = false;  // set to true for error logging
const mocha = require('mocha');
const assert = require('chai').assert;
const expect = require('chai').expect;
const bali = require('bali-component-framework');
const account = bali.parse('#GTDHQ9B8ZGS7WCBJJJBFF6KDCCF55R2P');
const testDirectory = 'test/config/';
const cloudURL = bali.reference('http://localhost:3000');
const notary = require('bali-digital-notary').api(account, testDirectory, debug);
const repository = require('../').cloud(notary, cloudURL, debug);

const source =
    '[\n' +
    '    $date: <2018-04-01>\n' +
    '    $product: "Snickers Bar"\n' +
    '    $quantity: 10\n' +
    '    $price: 1.25(USD)\n' +
    '    $tax: 1.07(USD)\n' +
    '    $total: 13.57(USD)\n' +
    ']';

describe('Bali Nebula API™', function() {

    describe('Test Cloud Repository', function() {

        it('should initialize the notary API once and only once', async function() {
            await notary.initializeAPI();
            await notary.generateKey();
            try {
                await notary.initializeAPI();
                assert.fail('The second attempt to initialize the API should have failed.');
            } catch(error) {
                // expected
            };
        });

        it('should initialize the cloud API once and only once', async function() {
            await repository.initializeAPI();
            try {
                await repository.initializeAPI();
                assert.fail('The second attempt to initialize the API should have failed.');
            } catch(error) {
                // expected
            };
        });

        it('should perform a draft document lifecycle', async function() {
            const identifier = 'NZRRDAB94B4ZH0WDRT5N3TGX2ZTVMSV2v1.2.3';

            // store a new draft in the repository
            await repository.saveDraft(identifier, source);

            // make sure the new draft exists in the repository
            var exists = await repository.draftExists(identifier);
            expect(exists).is.true;  // jshint ignore:line

            // make sure the same document does not exist in the repository
            exists = await repository.documentExists(identifier);
            expect(exists).is.false;  // jshint ignore:line

            // fetch the new draft from the repository
            const draft = await repository.fetchDraft(identifier);
            expect(draft).to.equal(source);

            // delete the new draft from the repository
            await repository.deleteDraft(identifier);

            // make sure the new draft no longer exists in the repository
            exists = await repository.draftExists(identifier);
            expect(exists).is.false;  // jshint ignore:line

            // delete a non-existent draft from the repository
            await repository.deleteDraft(identifier);

        });

        it('should perform a committed document lifecycle', async function() {
            const identifier = 'YK4KPZHX2ZPVS0NNK2YH368XP7FR05Y9v3.4';

            // store a new document in the repository
            await repository.createDocument(identifier, source);

            // make sure the same draft does not exist in the repository
            var exists = await repository.draftExists(identifier);
            expect(exists).is.false;  // jshint ignore:line

            // make sure the new document exists in the repository
            exists = await repository.documentExists(identifier);
            expect(exists).is.true;  // jshint ignore:line

            // fetch the new document from the repository
            const document = await repository.fetchDocument(identifier);
            expect(document).to.equal(source);

            // make sure the new document still exists in the repository
            exists = await repository.documentExists(identifier);
            expect(exists).is.true;  // jshint ignore:line

            // attempt to store the same document in the repository
            //expect(repository.createDocument.bind(repository, identifier, source)).to.throw();
            await repository.createDocument(identifier, source).then(function() {
                assert.fail('The attempt to store the same document should have failed.');
            }).catch(function(error) {
                // expected
            });

        });

        it('should perform a message queue lifecycle', async function() {
            const queueId = 'QSZNT8ABGSF75XR8FWHMYQCKTVK2WCPY';

            // make sure the message queue is empty
            var none = await repository.dequeueMessage(queueId);
            expect(none).to.not.exist;  // jshint ignore:line

            // queue up some messages
            await repository.queueMessage(queueId, "$first");
            await repository.queueMessage(queueId, "$second");
            await repository.queueMessage(queueId, "$third");

            // dequeue the messages
            await repository.dequeueMessage(queueId);
            await repository.dequeueMessage(queueId);
            await repository.dequeueMessage(queueId);

            // make sure the message queue is empty
            none = await repository.dequeueMessage(queueId);
            expect(none).to.not.exist;  // jshint ignore:line

        });

    });

});
