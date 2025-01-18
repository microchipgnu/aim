#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage:"
    echo "  ./deploy.sh                         - Deploy the application"
    echo "  ./deploy.sh --domain add <domain>   - Deploy and add a domain"
    echo "  ./deploy.sh --domain remove <domain>- Deploy and remove a domain"
    echo "  ./deploy.sh --domain list          - Deploy and list domains"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh --domain add api.yourdomain.com"
    echo "  ./deploy.sh --domain add *.yourdomain.com"
}

# Handle domain management
handle_domain() {
    case "$1" in
        "add")
            if [ -z "$2" ]; then
                print_error "Please provide a domain name"
                show_usage
                exit 1
            fi
            print_status "Adding domain: $2"
            
            # Create the certificate
            if flyctl certs create "$2"; then
                print_status "Certificate created successfully!"
                print_status "DNS Records needed for Namecheap:"
                echo ""
                print_status "For IPv4 (A Record):"
                flyctl ips list | grep -i "v4"
                echo ""
                print_status "For IPv6 (AAAA Record):"
                flyctl ips list | grep -i "v6"
                echo ""
                print_warning "Add these records in Namecheap with:"
                print_warning "- Host: start-here (or @ for root domain)"
                print_warning "- Value: (IP address from above)"
                print_warning "- TTL: Automatic"
                print_warning "Note: It may take up to 48 hours for DNS changes to propagate"
            else
                print_error "Failed to create certificate"
                exit 1
            fi
            ;;
        
        "remove")
            if [ -z "$2" ]; then
                print_error "Please provide a domain name"
                show_usage
                exit 1
            fi
            print_status "Removing domain: $2"
            if flyctl certs remove "$2"; then
                print_status "Certificate removed successfully!"
            else
                print_error "Failed to remove certificate"
                exit 1
            fi
            ;;
        
        "list")
            print_status "Current certificates:"
            flyctl certs list
            echo ""
            print_status "IP Addresses for DNS configuration:"
            flyctl ips list
            ;;
        
        *)
            print_error "Unknown domain action: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    print_error "flyctl is not installed. Please install it first:"
    print_warning "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if user is logged in to fly
if ! flyctl auth whoami &> /dev/null; then
    print_error "Not logged in to Fly.io. Please run:"
    print_warning "flyctl auth login"
    exit 1
fi

# Check if fly.toml exists
if [ ! -f fly.toml ]; then
    print_warning "fly.toml not found. Running initial setup..."
    flyctl launch
fi

# Load environment variables from .env file and set them as fly secrets
print_status "Loading environment variables from .env..."
if [ -f .env ]; then
    # Create a temporary array to hold all secrets
    secrets=()
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # Remove any quotes and leading/trailing whitespace from the value
        value=$(echo "$value" | tr -d '"' | tr -d "'" | xargs)
        key=$(echo "$key" | xargs)
        
        # Add to secrets array
        secrets+=("$key=$value")
    done < .env

    # Set all secrets at once if there are any
    if [ ${#secrets[@]} -gt 0 ]; then
        print_status "Setting Fly secrets..."
        flyctl secrets set "${secrets[@]}"
    fi
else
    print_warning ".env file not found, skipping secrets setup"
fi

# Deploy to fly
print_status "Deploying to fly.io..."
if flyctl deploy; then
    print_status "Deployment successful!"
    
    # Handle domain management if requested
    if [ "$1" = "--domain" ]; then
        handle_domain "$2" "$3"
    fi
    
    # Show the deployment status
    print_status "Deployment status:"
    flyctl status
    
    # Show the app URL
    print_status "App URL:"
    flyctl apps open
else
    print_error "Deployment failed!"
    exit 1
fi

# Show certificate status if domain was added
if [ "$1" = "--domain" ] && [ "$2" = "add" ]; then
    print_status "Certificate status:"
    flyctl certs list
fi 