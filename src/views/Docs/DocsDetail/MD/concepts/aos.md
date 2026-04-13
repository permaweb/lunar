# AOS

AOS is the interactive development environment for the AO network. It provides a Lua-based programming interface for creating and controlling processes. Understanding AOS is essential for building applications on AO.

AOS is available as a CLI, a package with JavaScript bindings (aoconnect), and inside Lunar as a browser-based tool.

AOS is available as a CLI, a package with JavaScript bindings (aoconnect), and inside Lunar as a browser-based tool.

#### What is AOS?

AOS is:

- **Interactive Environment**: Real-time Lua console for process interaction
- **Development Tool**: Write and test handlers on the fly
- **Programming Interface**: Full access to process state and capabilities
- **Message Framework**: Simplified message handling and routing
- **Standard Library**: Common utilities and patterns

#### AOS Documentation

The canonical source for AOS documentation is maintained separately and should be a 1:1 reference for Lunar's browser
embed of AOS.

For further reading:

- [aos GitHub README](https://github.com/permaweb/aos)
- [AO cookbook aos guide](https://cookbook_ao.arweave.net/guides/aos/index.html)
- [LLMs documentation for AO, including AOS reference](https://cookbook_ao.ar.io/llms-full.txt)

#### Using the AOS Console in Lunar

**Accessing the Console:**

1. Navigate to **Console** view from sidebar
2. Enter existing process ID or create new process
3. Wallet connection required for owned processes
4. Console loads with process information

**Console Features:**

**Command Execution:**

- Type Lua commands at the prompt
- Press Enter to execute
- View output immediately
- Errors shown in red

**Command History:**

- Arrow Up: Previous command
- Arrow Down: Next command
- Persists during session
- Navigate through history easily

**Multi-line Input:**

- Type complete code blocks
- Console detects incomplete statements
- Supports function definitions
- Indentation preserved

**Editor Mode:**

- Toggle between console and editor
- Write longer scripts
- Syntax highlighting
- Execute entire script

**Output Display:**

- Print statements shown in real-time
- Return values displayed
- Errors highlighted
- ANSI color support

#### Best Practices

**Development Workflow:**

1. **Create Process**: Start with new AOS process
2. **Define State**: Set up initial state structure
3. **Add Handlers**: Create handlers one at a time
4. **Test**: Use console to test each handler
5. **Iterate**: Refine based on testing
6. **Document**: Add comments and descriptions

**Handler Design:**

- **Single Responsibility**: Each handler does one thing well
- **Validation**: Check inputs before processing
- **Error Handling**: Use assert for requirements
- **Responses**: Always send response to message sender
- **Logging**: Use print for debugging

**State Management:**

- **Initialize**: Always use `State = State or {}`
- **Defaults**: Provide sensible default values
- **Consistency**: Keep state structure predictable
- **Cleanup**: Remove unused state data
- **Documentation**: Comment complex state structures

**Security:**

- **Validate Inputs**: Never trust message data blindly
- **Check Permissions**: Verify sender authorization
- **Limit Actions**: Restrict dangerous operations
- **Bounds Checking**: Prevent overflow/underflow
- **Rate Limiting**: Guard against spam
