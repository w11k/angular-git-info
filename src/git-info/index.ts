import { apply, chain, mergeWith, move, Rule, SchematicContext, Tree, url } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { concat, Observable, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { addPackageJsonDependency, NodeDependencyType } from '../utility/dependencies';
import { addPropertyToGitignore, addPropertyToPackageJson, getLatestNodeVersion, NodePackage } from '../utility/util';





export function gitInfo(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        return chain([
            updateDependencies(),
            addVersionGeneratorFile(),
            addVersionGeneratorToGitignore(),
            addScriptsToPackageJson(),
        ])(tree, context);
    };
}

function updateDependencies(): Rule {
    return (tree: Tree, context: SchematicContext): Observable<Tree> => {
        context.logger.debug('Updating dependencies...');
        context.addTask(new NodePackageInstallTask());

        const fixedDependencies = of({ name: 'fs-extra', version: '6.0.1' })
            .pipe(
                map((packageFromRegistry: NodePackage) => {
                    const { name, version } = packageFromRegistry;
                    context.logger.debug(`Adding ${name}:${version} to ${NodeDependencyType.Dev}`);

                    addPackageJsonDependency(tree, {
                        type: NodeDependencyType.Dev,
                        name,
                        version,
                    });

                    return tree;
                })
            );
        const addLatestDependencies = of('git-describe').pipe(
            concatMap((packageName: string) => getLatestNodeVersion(packageName)),
            map((packageFromRegistry: NodePackage) => {
                const { name, version } = packageFromRegistry;
                context.logger.debug(`Adding ${name}:${version} to ${NodeDependencyType.Dev}`);

                addPackageJsonDependency(tree, {
                    type: NodeDependencyType.Dev,
                    name,
                    version,
                });

                return tree;
            })
        );

        return concat(addLatestDependencies, fixedDependencies);
    };
}

function addVersionGeneratorFile(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.debug('adding file to host dir');

        return chain([mergeWith(apply(url('./files'), [move('./')]))])(tree, context);
    };
}

function addScriptsToPackageJson(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        addPropertyToPackageJson(tree, context, 'scripts', {
            'postinstall': 'node git-version.js'
        });
        return tree;
    };
}

function addVersionGeneratorToGitignore(): Rule {
    return (tree: Tree, context: SchematicContext) => {
        addPropertyToGitignore(tree, context, 'src/environments/version.ts');
        addPropertyToGitignore(tree, context, '*/environments/version.ts');
        return tree;
    };
}
