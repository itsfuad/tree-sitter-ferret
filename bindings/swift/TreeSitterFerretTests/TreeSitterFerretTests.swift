import XCTest
import SwiftTreeSitter
import TreeSitterFerret

final class TreeSitterFerretTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_ferret())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Ferret grammar")
    }
}
