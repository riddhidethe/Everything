
function Header(){
    return(
        <>
          <a className="logo" href="/jobSeeker/">Everything<span>.india</span></a>
          <nav>
            <ul>
              <li><a href="/jobSeeker/" className='navLinks'>Home</a></li>
              <li><a href="/jobSeeker/jobList" className='navLinks'>Find Jobs</a></li>
              <li><a href="/jobSeeker/applicant-dashboard" className='navLinks'>Dashboard</a></li>
            </ul>
          </nav>
        </>
    )
}

window.Header = Header;