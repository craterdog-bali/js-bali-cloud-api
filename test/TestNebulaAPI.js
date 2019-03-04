/************************************************************************
 * Copyright (c) Crater Dog Technologies(TM).  All Rights Reserved.     *
 ************************************************************************
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.        *
 *                                                                      *
 * This code is free software; you can redistribute it and/or modify it *
 * under the terms of The MIT License (MIT), as published by the Open   *
 * Source Initiative. (See http://opensource.org/licenses/MIT)          *
 ************************************************************************/

const testDirectory = 'test/config/';
const mocha = require('mocha');
const expect = require('chai').expect;
const bali = require('bali-component-framework');
const notary = require('bali-digital-notary');
const nebula = require('../');
const repository = nebula.local(testDirectory);

function extractId(component) {
    const identifier = component.getValue('$tag').getValue();
    const version = component.getValue('$version');
    return '' + identifier + version;
}

describe('Bali Nebula API™', function() {
    var consumerNotary;
    var consumerClient;
    var consumerCitation;
    var consumerCertificate;
    var merchantNotary;
    var merchantClient;
    var merchantCitation;
    var merchantCertificate;

    describe('Initialize Environment', function() {

        it('should setup the document repository', function() {
            expect(repository).to.exist;  // jshint ignore:line
        });

        it('should setup the digital notary for the consumer', async function() {
            const consumerTag = bali.tag();
            consumerNotary = notary.api(consumerTag, testDirectory);
            expect(consumerNotary).to.exist;  // jshint ignore:line
            consumerCertificate = consumerNotary.generateKeys();
            expect(consumerCertificate).to.exist;  // jshint ignore:line
            consumerCitation = consumerNotary.getCitation();
            expect(consumerCitation).to.exist;  // jshint ignore:line
            const certificateId = extractId(consumerCitation);
            await repository.createCertificate(certificateId, consumerCertificate);
        });

        it('should setup the digital notary for the merchant', async function() {
            const merchantTag = bali.tag();
            merchantNotary = notary.api(merchantTag, testDirectory);
            expect(merchantNotary).to.exist;  // jshint ignore:line
            merchantCertificate = merchantNotary.generateKeys();
            expect(merchantCertificate).to.exist;  // jshint ignore:line
            merchantCitation = merchantNotary.getCitation();
            expect(merchantCitation).to.exist;  // jshint ignore:line
            const certificateId = extractId(merchantCitation);
            await repository.createCertificate(certificateId, merchantCertificate);
        });

        it('should setup the client environment for the consumer', async function() {
            consumerClient = nebula.api(consumerNotary, repository);
            expect(consumerClient).to.exist;  // jshint ignore:line
            const citation = await consumerClient.retrieveCitation();
            expect(citation).to.exist;  // jshint ignore:line
            expect(citation.isEqualTo(consumerCitation)).to.equal(true);
            consumerCertificate = await consumerClient.retrieveCertificate(consumerCitation);
            expect(consumerCertificate).to.exist;  // jshint ignore:line
        });

        it('should setup the client environment for the merchant', async function() {
            merchantClient = nebula.api(merchantNotary, repository);
            expect(merchantClient).to.exist;  // jshint ignore:line
            const citation = await merchantClient.retrieveCitation();
            expect(citation).to.exist;  // jshint ignore:line
            expect(citation.isEqualTo(merchantCitation)).to.equal(true);
            merchantCertificate = await merchantClient.retrieveCertificate(merchantCitation);
            expect(merchantCertificate).to.exist;  // jshint ignore:line
        });

    });

    describe('Test Drafts', function() {
        var draft;
        var draftCitation;
        var draftSource;

        it('should create a new empty draft document', async function() {
            draftCitation = await consumerClient.createDraft();
            draft = await consumerClient.retrieveDraft(draftCitation);
            draft.setValue('$foo', '"bar"');
            draftSource = draft.toString();
        });

        it('should save a new draft document in the repository', async function() {
            draftCitation = await consumerClient.updateDraft(draft);
            expect(draft.toString()).to.equal(draftSource);
        });

        it('should retrieve the new draft document from the repository', async function() {
            draft = await consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString()).to.equal(draftSource);
        });

        it('should save an updated draft document in the repository', async function() {
            draft.setValue('$bar', '"baz"');
            draftCitation = await consumerClient.updateDraft(draft);
            expect(draft.toString()).to.not.equal(draftSource);
            expect(draft.getValue('$foo').toString()).to.equal('"bar"');
            expect(draft.getValue('$bar').toString()).to.equal('"baz"');
        });

        it('should discard the draft document in the repository', async function() {
            await consumerClient.discardDraft(draftCitation);
        });

        it('should verify that the draft document no longer exists in the repository', async function() {
            draft = await consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.not.exist;  // jshint ignore:line
        });

    });

    describe('Test Documents', function() {
        var draft;
        var draftCitation;
        var draftSource;
        var document;
        var documentCitation;

        it('should create a new draft document from a component', async function() {
            const catalog = bali.catalog();
            catalog.setValue('$foo', '"bar"');
            draftCitation = await consumerClient.createDraft(catalog);
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
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.equal(newSource);
        });

        it('should checkout a draft of the new document from the repository', async function() {
            draftCitation = await consumerClient.checkoutDocument(documentCitation);
            draft = await consumerClient.retrieveDraft(draftCitation);
            expect(draft).to.exist;  // jshint ignore:line
            expect(draft.toString().includes('$foo: "bar"')).to.equal(true);
        });

        it('should commit an updated version of the document to the repository', async function() {
            draft.setValue('$bar', '"baz"');
            documentCitation = await consumerClient.commitDocument(draft);
            expect(draft.getValue('$bar').toString()).to.equal('"baz"');
        });

        it('should retrieve the updated committed document from the repository', async function() {
            document = await consumerClient.retrieveDocument(documentCitation);
            expect(document).to.exist;  // jshint ignore:line
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
            expect(draft).to.not.exist;  // jshint ignore:line
        });

        it('should make sure the new document still exists in the repository', async function() {
            const newSource = document.toString();
            document = await consumerClient.retrieveDocument(documentCitation);
            expect(document).to.exist;  // jshint ignore:line
            expect(document.toString()).to.equal(newSource);
        });

    });

    describe('Test Types', function() {
        var typeCitation;

        it('should allow a new compiled type to be committed', async function() {
            const type = bali.catalog();
            type.setValue('$foo', '"bar"');
            const documentCitation = await merchantClient.createDraft(type);
            typeCitation = await merchantClient.commitType(type);
            expect(typeCitation).to.exist;  // jshint ignore:line
        });

        it('should allow a compiled type to be retrieved', async function() {
            const expected = await merchantClient.retrieveType(typeCitation);
            expect(expected).to.exist;  // jshint ignore:line
            const type = await consumerClient.retrieveType(typeCitation);
            expect(type).to.exist;  // jshint ignore:line
            expect(type.toString()).to.equal(expected.toString());
        });

    });

    describe('Test Messages', function() {
        const queue = bali.tag('DRRHB9K8X3LQV8JTGZNL74HW4FTW6L7B');
        const source =
            '[\n' +
            '    $date: <2018-04-01>\n' +
            '    $product: "Snickers Bar"\n' +
            '    $quantity: 10\n' +
            '    $price: 1.25(USD)\n' +
            '    $tax: 1.07(USD)\n' +
            '    $total: 13.57(USD)\n' +
            ']\n';

        it('should allow the merchant to verify that the queue is empty', async function() {
            const message = await merchantClient.receiveMessage(queue);
            expect(message).to.not.exist;  // jshint ignore:line
        });

        it('should allow the consumer to place some transactions on the queue', async function() {
            for (var i = 0; i < 3; i++) {
                transaction = bali.parse(source);
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
        const source =
            '[\n' +
            '    $type: $TransactionPosted\n' +
            '    $transaction: <bali:?[$protocol:v1,$tag:#WTFL0GLK7V5SJBZKCX9NH0KQWH0JYBL9,$version:v1,$hash:\'R5BXA11KMC4W117RNY197MQVJ78VND18FXTXPT1A0PL2TYKYPHZTAAVVA6FHBRZ9N46P7102GSY8PVTQBBFTF3QYS8Q02H9S3ZLP8L8\']>\n' +
            ']\n';

        it('should allow the merchant to publish an event', async function() {
            const event = bali.parse(source);
            await merchantClient.publishEvent(event);
        });


    });

});
