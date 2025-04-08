
function Header(){
    return(
        <>
          <a className="logo" href="/api/buyer/home">Everything<span>.india</span></a>
          <nav>
            <ul>
              <li><a href="/api/buyer/home" className='navLinks'>Home</a></li>
              <li><a href="/api/buyer/job-list" className='navLinks'>Find Jobs</a></li>
              <li><a href="/api/buyer/applicant-dashboard" className='navLinks'>Dashboard</a></li>
            </ul>
          </nav>
        </>
    )
}

window.Header = Header;