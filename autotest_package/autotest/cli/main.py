import argparse
import sys
from ..core.web_test_generator import WebTestGenerator

def main():
    parser = argparse.ArgumentParser(description="AI Automated Testing Agent")
    parser.add_argument("--url", required=True, help="Base URL to start testing")
    parser.add_argument("--username", help="Login username")
    parser.add_argument("--password", help="Login password")
    parser.add_argument("--loglevel", "-l", 
                        default="INFO",
                        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
                        help="Set logging level")
    parser.add_argument("--selenium-version", 
                        default="4.15.2",
                        help="Selenium version to use in generated scripts")
    parser.add_argument("--wait-time", 
                        default="",
                        help="Custom wait time text for CAPTCHA handling")
    parser.add_argument("--testing-tool",
                        default="selenium",
                        choices=["selenium", "playwright", "puppeteer"],
                        help="Testing framework to generate scripts for")
    parser.add_argument("--language",
                        default="python",
                        help="Programming language for test scripts")
    
    # Recursive testing arguments
    parser.add_argument("--recursive", "-r",
                       action="store_true",
                       default=True,  # Defaulted to True since this agent processes loops
                       help="Enable recursive URL extraction and testing")
    parser.add_argument("--max-depth",
                       type=int,
                       default=1,
                       help="Maximum depth for recursive URL extraction (default: 1)")
    
    parser.add_argument("--no-cache",
                        action="store_true",
                        help="Disable use of cache memory during testing")
    
    parser.add_argument("--llm-provider",
                    type=int,
                    choices=[1, 2, 3, 4, 5],
                    default=1,
                    help="LLM Provider choice: 1=OpenAI, 2=Groq, 3=Google-Gemini, 4=Anthropic, 5=Ollama")
    
    args = parser.parse_args()
    
    try:
        # Initialize the actual generator class from your core modules
        tester = WebTestGenerator(
            log_level=args.loglevel.upper(), 
            selenium_version=args.selenium_version, 
            wait_time=args.wait_time, 
            testing_tool=args.testing_tool, 
            language=args.language,
            llm_provider_choice=args.llm_provider
        )
    except ValueError as e:
        print(f"Invalid configuration: {str(e)}")
        sys.exit(1)
        
    print(f"[*] Agent Initializing for {args.url} using {args.testing_tool}...")

    # run_workflow handles both the URL crawl extraction and the test generation automatically
    report_result = tester.run_workflow(
        url=args.url,  # Changed from base_url to url
        username=args.username, 
        password=args.password, 
        no_cache=args.no_cache, 
        recursive=args.recursive, 
        max_depth=args.max_depth
    )
    
    if args.recursive and isinstance(report_result, list):
        print(f"\n[+] Test reports generated ({len(report_result)} files):")
        for i, report_file in enumerate(report_result, 1):
            print(f"  {i}. {report_file}")
    else:
        print(f"\n[+] Test report generated: {report_result}")

if __name__ == "__main__":
    main()