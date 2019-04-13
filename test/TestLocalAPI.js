/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const debug = true;  // set to true for error logging
const directory = 'test/config/';
const mocha = require('mocha');
const assert = require('chai').assert;
const expect = require('chai').expect;
const bali = require('bali-component-framework');
const notary = require('bali-digital-notary');
const nebula = require('../');

function extractId(component) {
    const identifier = component.getValue('$tag').getValue();
    const version = component.getValue('$version');
    return '' + identifier + version;
}

describe('Bali Nebula API™ - Test Local API', function() {
    var consumerNotary;
    var consumerRepository;
    var consumerClient;
    var consumerCitation;
    var consumerCertificate;
    var merchantNotary;
    var merchantRepository;
    var merchantClient;
    var merchantCitation;
    var merchantCertificate;

    describe('Initialize Environment', function() {

        it('should create the consumer notary API', async function() {
            const consumerTag = bali.tag();
            consumerNotary = notary.api(consumerTag, directory);
            expect(consumerNotary).to.exist;
        });

        it('should create the merchant notary API', async function() {
            const merchantTag = bali.tag();
            merchantNotary = notary.api(merchantTag, directory);
            expect(merchantNotary).to.exist;
        });

        it('should create the consumer nebula API', async function() {
            consumerRepository = nebula.local(directory);
            consumerClient = nebula.api(consumerNotary, consumerRepository, debug);
            expect(consumerClient).to.exist;
        });

        it('should create the merchant nebula API', async function() {
            merchantRepository = nebula.local(directory);
            merchantClient = nebula.api(merchantNotary, merchantRepository, debug);
            expect(merchantClient).to.exist;
        });

        it('should setup the digital notary for the consumer', async function() {
            consumerCertificate = await consumerNotary.generateKey();
            expect(consumerCertificate).to.exist;
            consumerCitation = await consumerNotary.getCitation();
            expect(consumerCitation).to.exist;
            const certificateId = extractId(consumerCitation);
            await consumerRepository.createCertificate(certificateId, consumerCertificate);
        });

        it('should setup the digital notary for the merchant', async function() {
            merchantCertificate = await merchantNotary.generateKey();
            expect(merchantCertificate).to.exist;
            merchantCitation = await merchantNotary.getCitation();
            expect(merchantCitation).to.exist;
            var certificateId = extractId(merchantCitation);
            await merchantRepository.createCertificate(certificateId, merchantCertificate);
            merchantCertificate = await merchantNotary.generateKey();  // test regeneration
            expect(merchantCertificate).to.exist;
            merchantCitation = await merchantNotary.getCitation();
            expect(merchantCitation).to.exist;
            certificateId = extractId(merchantCitation);
            await merchantRepository.createCertificate(certificateId, merchantCertificate);
        });

        it('should setup the client environment for the consumer', async function() {
            const citation = await consumerClient.getCitation();
            expect(citation).to.exist;
            expect(citation.isEqualTo(consumerCitation)).to.equal(true);
            consumerCertificate = await consumerClient.retrieveCertificate(consumerCitation);
            expect(consumerCertificate).to.exist;
        });

        it('should setup the client environment for the merchant', async function() {
            const citation = await merchantClient.getCitation();
            expect(citation).to.exist;
            expect(citation.isEqualTo(merchantCitation)).to.equal(true);
            merchantCertificate = await merchantClient.retrieveCertificate(merchantCitation);
            expect(merchantCertificate).to.exist;
        });

    });

    describe('Test Drafts', function() {
        var draft = bali.catalog({
            $foo: bali.text('bar')
        }, bali.parameters({
            $tag: bali.tag(),
            $version: bali.version(),
            $permissions: bali.parse('/bali/permissions/public/v1'),
            $previous: bali.NONE
        }));
        var draftCitation;
        var draftSource = draft.toString();

        it('should save a new draft document in the repository', async function() {
            draftCitation = await consumerClient.saveDraft(draft);
            expect(draft.toString()).to.equal(draftSource);
        });

        it('should retrieve the new draft document from the repository', async function() {
            draft = await consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.exist;
            expect(draft.toString()).to.equal(draftSource);
        });

        it('should save an updated draft document in the repository', async function() {
            draft.setValue('$bar', '"baz"');
            draftCitation = await consumerClient.saveDraft(draft);
            expect(draft.toString()).to.not.equal(draftSource);
            expect(draft.getValue('$foo').toString()).to.equal('"bar"');
            expect(draft.getValue('$bar').toString()).to.equal('"baz"');
        });

        it('should discard the draft document in the repository', async function() {
            await consumerClient.discardDraft(draftCitation);
        });

        it('should verify that the draft document no longer exists in the repository', async function() {
            draft = await consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.not.exist;
        });

    });

    describe('Test Documents', function() {
        var draft;
        var draftCitation;
        var draftSource;
        var document;
        var documentCitation;

        it('should create a new draft document from a component', async function() {
            const catalog = bali.catalog({
                $foo: '"bar"'
            }, bali.parameters({
                $tag: bali.tag(),
                $version: bali.version(),
                $permissions: bali.parse('/bali/permissions/private/v1'),
                $previous: bali.NONE
            }));
            draftCitation = await consumerClient.saveDraft(catalog);
            draft = await consumerClient.retrieveDraft(draftCitation);
            draftSource = draft.toString();
        });


        it('should commit a draft of a new document to the repository', async function() {
            documentCitation = await consumerClient.commitDocument(draft);
            expect(documentCitation.getValue('$tag').isEqualTo(draftCitation.getValue('$tag'))).to.equal(true);
            expect(documentCitation.getValue('$version').isEqualTo(draftCitation.getValue('$version'))).to.equal(true);
            document = await consumerClient.retrieveDocument(documentCitation);
            expect(document.toString()).to.equal(draftSource);
        });

        it('should retrieve the committed document from the repository', async function() {
            const newSource = document.toString();
            document = await consumerClient.retrieveDocument(documentCitation);
            expect(document).to.exist;
            expect(document.toString()).to.equal(newSource);
        });

        it('should checkout a draft of the new document from the repository', async function() {
            draftCitation = await consumerClient.checkoutDocument(documentCitation);
            draft = await consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.exist;
            expect(draft.toString().includes('$foo: "bar"')).to.equal(true);
        });

        it('should commit an updated version of the document to the repository', async function() {
            draft.setValue('$bar', '"baz"');
            documentCitation = await consumerClient.commitDocument(draft);
            expect(draft.getValue('$bar').toString()).to.equal('"baz"');
        });

        it('should retrieve the updated committed document from the repository', async function() {
            document = await consumerClient.retrieveDocument(documentCitation);
            expect(document).to.exist;
            expect(document.getValue('$bar').toString()).to.equal('"baz"');
        });

        it('should checkout the latest version of the document from the repository', async function() {
            draftCitation = await consumerClient.checkoutDocument(documentCitation, 2);
            draft = await consumerClient.retrieveDraft(draftCitation);
        });

        it('should discard the draft document in the repository', async function() {
            await consumerClient.discardDraft(draftCitation);
        });

        it('should verify that the draft document no longer exists in the repository', async function() {
            draft = await consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.not.exist;
        });

        it('should make sure the new document still exists in the repository', async function() {
            const newSource = document.toString();
            document = await consumerClient.retrieveDocument(documentCitation);
            expect(document).to.exist;
            expect(document.toString()).to.equal(newSource);
        });

    });

    describe('Test Types', function() {
        var typeCitation;

        it('should allow a new compiled type to be committed', async function() {
            const type = bali.catalog({
                $foo: '"bar"'
            }, bali.parameters({
                $type: '/bali/abstractions/Type/v1',
                $tag: bali.tag(),
                $version: bali.version(),
                $permissions: '/bali/permissions/public/v1',
                $previous: bali.NONE
            }));
            const documentCitation = await merchantClient.saveDraft(type);
            typeCitation = await merchantClient.commitType(type);
            expect(typeCitation).to.exist;
        });

        it('should allow a compiled type to be retrieved', async function() {
            const expected = await merchantClient.retrieveType(typeCitation);
            expect(expected).to.exist;
            const type = await consumerClient.retrieveType(typeCitation);
            expect(type).to.exist;
            expect(type.toString()).to.equal(expected.toString());
        });

    });

    describe('Test Messages', function() {
        var queue = bali.tag();

        it('should allow the merchant to verify that the queue is empty', async function() {
            const message = await merchantClient.receiveMessage(queue);
            expect(message).to.not.exist;
        });

        it('should allow the consumer to place some transactions on the queue', async function() {
            for (var i = 0; i < 3; i++) {
                transaction = bali.catalog({
                    $timestamp: bali.moment(),
                    $product: bali.text('Snickers Bar'),
                    $quantity: i,
                    $price: bali.parse('1.25($USD)'),
                    $tax: bali.parse('1.07($USD)'),
                    $total: bali.parse('13.57($USD)')
                }, bali.parameters({
                    $tag: bali.tag(),
                    $version: bali.version(),
                    $permissions: bali.parse('/bali/permissions/public/v1'),
                    $previous: bali.NONE
                }));
                await consumerClient.queueMessage(queue, transaction);
            }
        });

        it('should allow the merchant to retrieve the transactions from the queue', async function() {
            var count = 0;
            var transaction = await merchantClient.receiveMessage(queue);
            while (transaction) {
                count++;

                var tag = transaction.getParameters().getParameter('$tag');
                var documentCitation = await merchantClient.commitDocument(transaction);
                expect(documentCitation.getValue('$tag').isEqualTo(tag)).to.equal(true);
                expect(documentCitation.getValue('$version').toString()).to.equal('v1');
                transaction = await merchantClient.receiveMessage(queue);
            }
            expect(count).to.equal(3);
        });

    });

    describe('Test Events', function() {
        const event = bali.catalog({
            $type: '$transactionPosted',
            $transactionId: bali.tag(),
            $timestamp: bali.moment()
        }, bali.parameters({
            $tag: bali.tag(),
            $version: bali.version(),
            $permissions: bali.parse('/bali/permissions/public/v1'),
            $previous: bali.NONE
        }));

        it('should allow the merchant to publish an event', async function() {
            await merchantClient.publishEvent(event);
        });


    });

});
