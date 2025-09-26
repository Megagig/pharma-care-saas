import { Button, Separator } from '@/components/ui/button';
const Footer = () => {
  return (
    <div
      component="footer"
      className=""
    >
      <div maxWidth="lg">
        <div
          className="">
          {/* Brand Section */}
          <div className="">
            <div className="">
              <div
                className=""
              >
                <div
                  
                  className=""
                >
                  PC
                </div>
              </div>
              <div
                
                className=""
              >
                PharmaCare
              </div>
            </div>
            <div  color="text.secondary" className="">
              Empowering pharmacists and healthcare professionals with advanced
              patient management, medication tracking, and clinical
              documentation tools.
            </div>
            <div className="">
              <div  color="text.secondary">
                Made with
              </div>
              <FavoriteIcon
                className=""
              />
              <div  color="text.secondary">
                for pharmacists
              </div>
            </div>
          </div>
          {/* Links Sections */}
          <div className="">
            <div
              className="">
              {/* Product Links */}
              <div className="">
                <div
                  
                  className=""
                >
                  Product
                </div>
                <div spacing={1}>
                  <Button
                    
                    to="/dashboard"
                    
                    size="small"
                    className="">
                    Dashboard
                  </Button>
                  <Button
                    
                    to="/patients"
                    
                    size="small"
                    className="">
                    Patient Management
                  </Button>
                  <Button
                    
                    to="/medications"
                    
                    size="small"
                    className="">
                    Medications
                  </Button>
                  <Button
                    
                    to="/clinical-notes"
                    
                    size="small"
                    className="">
                    Clinical Notes
                  </Button>
                </div>
              </div>
              {/* Company Links */}
              <div className="">
                <div
                  
                  className=""
                >
                  Company
                </div>
                <div spacing={1}>
                  <Button
                    
                    to="/about"
                    
                    size="small"
                    className="">
                    About Us
                  </Button>
                  <Button
                    
                    to="/pricing"
                    
                    size="small"
                    className="">
                    Pricing
                  </Button>
                  <Button
                    
                    to="/contact"
                    
                    size="small"
                    className="">
                    Contact
                  </Button>
                </div>
              </div>
              {/* Resources Links */}
              <div className="">
                <div
                  
                  className=""
                >
                  Resources
                </div>
                <div spacing={1}>
                  <Button
                    href="#"
                    
                    size="small"
                    className="">
                    Documentation
                  </Button>
                  <Button
                    href="#"
                    
                    size="small"
                    className="">
                    API Reference
                  </Button>
                  <Button
                    href="#"
                    
                    size="small"
                    className="">
                    Help Center
                  </Button>
                  <Button
                    href="#"
                    
                    size="small"
                    className="">
                    Community
                  </Button>
                </div>
              </div>
              {/* Legal Links */}
              <div className="">
                <div
                  
                  className=""
                >
                  Legal
                </div>
                <div spacing={1}>
                  <Button
                    href="#"
                    
                    size="small"
                    className="">
                    Privacy Policy
                  </Button>
                  <Button
                    href="#"
                    
                    size="small"
                    className="">
                    Terms of Service
                  </Button>
                  <Button
                    href="#"
                    
                    size="small"
                    className="">
                    HIPAA Compliance
                  </Button>
                  <Button
                    href="#"
                    
                    size="small"
                    className="">
                    Security
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Separator className="" />
        {/* Bottom Section */}
        <div
          className="">
          <div  color="text.secondary">
            © {new Date().getFullYear()} PharmaCare. All rights reserved.
          </div>
          {/* Social Media Links */}
          <div className="">
            <div  color="text.secondary" className="">
              Follow us:
            </div>
            <IconButton
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              className="">
              <TwitterIcon fontSize="small" />
            </IconButton>
            <IconButton
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              className="">
              <LinkedInIcon fontSize="small" />
            </IconButton>
            <IconButton
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              className="">
              <GitHubIcon fontSize="small" />
            </IconButton>
            <IconButton
              href="mailto:support@pharmacare.com"
              size="small"
              className="">
              <EmailIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Footer;
