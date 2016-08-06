"use strict";

import { SignatureHelpProvider, SignatureHelp, SignatureInformation, TextDocument, Location, Uri, Position, CancellationToken, CompletionItemProvider, CompletionList, CompletionItem, CompletionItemKind, TextEdit, Range } from "vscode";
import { Analyzer } from "./analyzer";
import * as as from "./analysis_server_types";
import * as util from "./utils";

// TODO: WIP. Registration is commented out in extension.ts.

export class DartSignatureHelpProvider implements SignatureHelpProvider {
	private analyzer: Analyzer;
	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

	provideSignatureHelp(document: TextDocument, position: Position, token: CancellationToken): Thenable<SignatureHelp> {
		return new Promise<SignatureHelp>((resolve, reject) => {
			this.analyzer.completionGetSuggestions({
				file: document.fileName,
				offset: document.offsetAt(position)
			}).then(resp => {
				var disposable = this.analyzer.registerForCompletionResults(notification => {
					// Skip any results that are not ours (or are not the final results).
					if (notification.id != resp.id || !notification.isLast)
						return;

					disposable.dispose();

					let argResults = notification.results.filter(r => r.kind == "ARGUMENT_LIST");
					resolve({
						activeParameter: 1,
						activeSignature: 1,
						signatures: argResults.map(r => this.convertResult(r))
					});
				})
			});
		});
	}

	private convertResult(result: as.CompletionSuggestion): SignatureInformation {
		return {
			label: result.completion,
			documentation: result.docSummary,
			parameters: result.parameterNames.map((pn, i) => {
				return {
					documentation: result.parameterTypes[i],
					label: pn
				};
			})
		};
	}
}