/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const mocha = require('mocha');
const assert = require('chai').assert;
const expect = require('chai').expect;
const bali = require('bali-component-framework');
const accountId = bali.parse('#GTDHQ9B8ZGS7WCBJJJBFF6KDCCF55R2P');
const directory = 'test/config/';
const cloudURL = bali.reference('http://localhost:3000');
const notary = require('bali-digital-notary').api(accountId, directory);
const repository = require('../').cloud(notary, cloudURL);

const transaction = bali.catalog({
    $timestamp: bali.moment(),
    $product: bali.text('Snickers Bar'),
    $quantity: 10,
    $price: bali.parse('1.25($USD)'),
    $tax: bali.parse('1.07($USD)'),
    $total: bali.parse('13.57($USD)')
}, bali.parameters({
    $tag: bali.tag(),
    $version: bali.version(),
    $permissions: bali.parse('/bali/permissions/public/v1'),
    $previous: bali.NONE
}));

const source = transaction.toString();

describe('Bali Nebula API™ - Test Cloud Repository', function() {

    describe('Test Cloud Repository', function() {

        it('should perform a notary certificate lifecycle', async function() {
            const identifier = 'KHMSK2LPXSWYMLZ8KJFNTL461A13M8Z7v3';

            // generate a new notary key
            await notary.generateKey();

            // store a new certificate in the repository
            await repository.createCertificate(identifier, source);

            // make sure the new certificate exists in the repository
            exists = await repository.certificateExists(identifier);
            expect(exists).is.true;

            // fetch the new certificate from the repository
            const certificate = await repository.fetchCertificate(identifier);
            expect(certificate).to.equal(source);

            // make sure the new certificate still exists in the repository
            exists = await repository.certificateExists(identifier);
            expect(exists).is.true;

            // attempt to store the same certificate in the repository
            try {
                await repository.createCertificate(identifier, source);
                assert.fail('The attempt to store the same certificate should have failed.');
            } catch (error) {
                // expected
            };

        });

        it('should perform a component type lifecycle', async function() {
            const identifier = '1T2KNYM32FZ83VZQYP1ATMPQGNMWDVYAv1';

            // store a new type in the repository
            await repository.createType(identifier, source);

            // make sure the new type exists in the repository
            exists = await repository.typeExists(identifier);
            expect(exists).is.true;

            // fetch the new type from the repository
            const type = await repository.fetchType(identifier);
            expect(type).to.equal(source);

            // make sure the new type still exists in the repository
            exists = await repository.typeExists(identifier);
            expect(exists).is.true;

            // attempt to store the same type in the repository
            try {
                await repository.createType(identifier, source);
                assert.fail('The attempt to store the same type should have failed.');
            } catch (error) {
                // expected
            };

        });

        it('should perform a draft document lifecycle', async function() {
            const identifier = 'PLR85ZV07WQ6K178XLMZSJ14NLZ03QCQv1.2.3';

            // store a new draft in the repository
            await repository.saveDraft(identifier, source);

            // make sure the new draft exists in the repository
            var exists = await repository.draftExists(identifier);
            expect(exists).is.true;

            // make sure the same document does not exist in the repository
            exists = await repository.documentExists(identifier);
            expect(exists).is.false;

            // fetch the new draft from the repository
            const draft = await repository.fetchDraft(identifier);
            expect(draft).to.equal(source);

            // delete the new draft from the repository
            await repository.deleteDraft(identifier);

            // make sure the new draft no longer exists in the repository
            exists = await repository.draftExists(identifier);
            expect(exists).is.false;

            // delete a non-existent draft from the repository
            await repository.deleteDraft(identifier);

        });

        it('should perform a committed document lifecycle', async function() {
            const identifier = 'YJM0T2PPPKQTCL0VTTBDH7V54XCHHKZAv3.4';

            // store a new document in the repository
            await repository.createDocument(identifier, source);

            // make sure the same draft does not exist in the repository
            var exists = await repository.draftExists(identifier);
            expect(exists).is.false;

            // make sure the new document exists in the repository
            exists = await repository.documentExists(identifier);
            expect(exists).is.true;

            // fetch the new document from the repository
            const document = await repository.fetchDocument(identifier);
            expect(document).to.equal(source);

            // make sure the new document still exists in the repository
            exists = await repository.documentExists(identifier);
            expect(exists).is.true;

            // attempt to store the same document in the repository
            try {
                await repository.createDocument(identifier, source);
                assert.fail('The attempt to store the same document should have failed.');
            } catch (error) {
                // expected
            };

        });

        it('should perform a message queue lifecycle', async function() {
            const queueId = 'JW1FBS2SJ8N8QQRNDDWGD7H8Z2NN0LDG';

            // make sure the message queue is empty
            var none = await repository.dequeueMessage(queueId);
            expect(none).to.not.exist;

            // queue up some messages
            await repository.queueMessage(queueId, "$first");
            await repository.queueMessage(queueId, "$second");
            await repository.queueMessage(queueId, "$third");

            // dequeue the messages
            var message = await repository.dequeueMessage(queueId);
            expect(message).to.exist;
            message = await repository.dequeueMessage(queueId);
            expect(message).to.exist;
            message = await repository.dequeueMessage(queueId);
            expect(message).to.exist;

            // make sure the message queue is empty
            none = await repository.dequeueMessage(queueId);
            expect(none).to.not.exist;

        });

    });

});
