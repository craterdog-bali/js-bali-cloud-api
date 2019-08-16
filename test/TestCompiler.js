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
const directory = 'test/config/';
const fs = require('fs');
const mocha = require('mocha');
const expect = require('chai').expect;
const bali = require('bali-component-framework');
const account = bali.tag('GTDHQ9B8ZGS7WCBJJJBFF6KDCCF55R2P');
const securityModule = require('bali-digital-notary').ssm(directory + account, debug);
const notary = require('bali-digital-notary').api(securityModule, account, directory, debug);
const repository = require('bali-document-repository').local(directory, debug);
const compiler = require('bali-procedure-compiler');
const nebula = require('../').api(notary, repository, compiler, debug);


describe('Bali Virtual Macine™', function() {

    describe('Initialize the environment', function() {

        it('should generate a new key pair and store the certificate in the repository', async function() {
            const certificate = await notary.generateKey();
            const citation = await notary.getCitation();
            const certificateId = '' + citation.getValue('$tag').getValue() + citation.getValue('$version');
            await repository.createDocument(certificateId, certificate);
        });

    });

    describe('Test the analysis and compilation of example types', function() {

        it('should compile example type documents into compiled type documents.', async function() {
            const testFolder = 'test/examples/';
            const files = fs.readdirSync(testFolder);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (!file.endsWith('.bali')) continue;
                console.log('      ' + file);
                var prefix = file.split('.').slice(0, 1);
                var typeFile = testFolder + prefix + '.bali';
                var proceduresFile = testFolder + prefix + '.procedures';
                var source = fs.readFileSync(typeFile, 'utf8');
                expect(source).to.exist;
                var type = bali.parse(source);
                var typeCitation = await nebula.compileType(type);
                expect(typeCitation).to.exist;
                var type = await nebula.retrieveDocument(typeCitation);
                const compiledCitation = type.getValue('$compiled');
                const procedures = await nebula.retrieveDocument(compiledCitation);
                source = procedures.toString() + '\n';  // POSIX compliant <EOL>
                //fs.writeFileSync(proceduresFile, source, 'utf8');
                var expected = fs.readFileSync(proceduresFile, 'utf8');
                expect(source).to.equal(expected);
            }
        });

        it('should compile the Bali types.', async function() {
            const testFolder = 'test/types/';
            for (var i = 0; i < sources.length; i++) {
                var file = sources[i];
                console.log('      ' + file);
                var source = fs.readFileSync(testFolder + file, 'utf8');
                expect(source).to.exist;
                var draft = bali.parse(source);
                const typeCitation = await nebula.compileType(draft);
                expect(typeCitation).to.exist;
                const type = await nebula.retrieveDocument(typeCitation);
            }
        });

    });

});

const sources = [
    'Component.bali',
    'Sequential.bali',
    'Element.bali',
    'Composite.bali',
    'Type.bali'
];

