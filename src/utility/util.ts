import { JsonAstObject, JsonParseMode, parseJsonAst, } from '@angular-devkit/core';

import { SchematicContext, SchematicsException, Tree, } from '@angular-devkit/schematics';

import { pkgJson, } from './dependencies';

import { appendPropertyInAstObject, findPropertyInAstObject, insertPropertyInAstObjectInOrder, } from './json-utils';

import { get } from 'https';

export interface NodePackage {
    name: string;
    version: string;
}

export enum Configs {
    JsonIndentLevel = 4,
}

export const GIT_IGNORE_FILE = '.gitignore';

export function addPropertyToPackageJson(
    tree: Tree,
    context: SchematicContext,
    propertyName: string,
    propertyValue: { [key: string]: any }
) {
    const packageJsonAst = parseJsonAtPath(tree, pkgJson.Path);
    const pkgNode = findPropertyInAstObject(packageJsonAst, propertyName);
    const recorder = tree.beginUpdate(pkgJson.Path);

    if (!pkgNode) {
        // outer node missing, add key/value
        appendPropertyInAstObject(
            recorder,
            packageJsonAst,
            propertyName,
            propertyValue,
            Configs.JsonIndentLevel
        );
    } else if (pkgNode.kind === 'object') {
        // property exists, update values
        for (let [key, value] of Object.entries(propertyValue)) {
            const innerNode = findPropertyInAstObject(pkgNode, key);

            if (!innerNode) {
                // script not found, add it
                context.logger.debug(`creating ${key} with ${value}`);

                insertPropertyInAstObjectInOrder(
                    recorder,
                    pkgNode,
                    key,
                    value,
                    Configs.JsonIndentLevel
                );
            } else {
                // script found, overwrite value
                context.logger.debug(`overwriting ${key} with ${value}`);

                const {end, start} = innerNode;

                recorder.remove(start.offset, end.offset - start.offset);
                recorder.insertRight(start.offset, JSON.stringify(value));
            }
        }
    }

    tree.commitUpdate(recorder);
}

export function addPropertyToGitignore(tree: Tree, _context: SchematicContext, file: string) {
    if (tree.exists(GIT_IGNORE_FILE)) {
        const buffer = tree.read(GIT_IGNORE_FILE);
        if (buffer === null) {
            throw new SchematicsException(`Could not read .gitignore`);
        }

        const content = buffer.toString();
        _context.logger.debug('gitignore content' + content);

        const updatedContent = `${content}\n${file}`;

        tree.overwrite(GIT_IGNORE_FILE, updatedContent);
    } else {
        _context.logger.debug('no gitignore found');
    }
}

/**
 * Attempt to retrieve the latest package version from NPM
 * Return an optional "latest" version in case of error
 * @param packageName
 */
export function getLatestNodeVersion(packageName: string): Promise<NodePackage> {
    const DEFAULT_VERSION = 'latest';

    return new Promise((resolve) => {
        return get(`https://registry.npmjs.org/${packageName}`, (res) => {
            let rawData = '';
            res.on('data', (chunk) => (rawData += chunk));
            res.on('end', () => {
                try {
                    const response = JSON.parse(rawData);
                    const version = (response && response['dist-tags']) || {};

                    resolve(buildPackage(packageName, version.latest));
                } catch (e) {
                    resolve(buildPackage(packageName));
                }
            });
        }).on('error', () => resolve(buildPackage(packageName)));
    });

    function buildPackage(name: string, version: string = DEFAULT_VERSION): NodePackage {
        return {name, version};
    }
}

export function parseJsonAtPath(tree: Tree, path: string): JsonAstObject {
    const buffer = tree.read(path);

    if (buffer === null) {
        throw new SchematicsException('Could not read package.json.');
    }

    const content = buffer.toString();

    const json = parseJsonAst(content, JsonParseMode.Strict);
    if (json.kind != 'object') {
        throw new SchematicsException(
            'Invalid package.json. Was expecting an object'
        );
    }

    return json;
}
