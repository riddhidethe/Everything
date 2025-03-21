function RecruiterFooter() {
    return (
      <>
          <div className="footerColumn">
              <h1>Everything.india</h1>
              <div className="footerColumnContent">
                  <p>Copyright <i class="fa-regular fa-copyright"></i> 2025</p>
                  <p>All right reserved</p>
                  <div className="socialIconBox">
                  <a href="#"><i class="fa-brands fa-linkedin"></i></a>
                  <a href="#"><i class="fa-brands fa-x-twitter"></i></a>
                  <a href="#"><i class="fa-brands fa-facebook"></i></a>
                  <a href="#"><i class="fa-brands fa-instagram"></i></a>
                  </div>
              </div>
          </div>
  
          <div className="footerColumn">
              <h3>Get In Touch</h3>
              <div className="footerColumnContent footerContactColumn">
                  <a href="#"><i class="fa-solid fa-envelope"></i> +91 94296 91838 | +91 70904 11555</a>
                  <a href="#"><i class="fa-solid fa-envelope"></i> management@hityourbusiness.com</a>
                  <a href="#"><i class="fa-solid fa-envelope"></i> support@hityourbusiness.com</a>
              </div>
          </div>
  
          <div className="footerColumn newsLetterColumn">
              <h3>Our NewsLetter</h3>
              <p>Subscribe to our newsletter to get our news & deals delivered to you.</p>
              <div className="footerColumnContent">
                  <div className="newsletterEmailBox">
                      <form action="#">
                          <input type="email" name="useremail" id="useremail" placeholder='Email Id'/>
                      </form>
                      <button type="submit" className="join-btn">Join</button>
                  </div>
              </div>
          </div>
  
          
      </>
    )
  }
  
  window.RecruiterFooter = RecruiterFooter;