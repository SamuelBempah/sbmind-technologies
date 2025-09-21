const Footer = () => {
  return (
    <footer className="w-screen bg-[#5542ff] py-6 text-white">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        {/* Company Info */}
        <div className="text-center md:text-left">
          <p className="text-sm font-light">
            SBMind Technologies Ghana, Remote Branches in Namibia, South Africa and USA
          </p>
          <p className="text-xs font-light opacity-80">
            SBMind Technologies BN114500925
          </p>
        </div>

        {/* Privacy Policy */}
        <a
          href="/privacy-policy"
          className="text-sm font-light hover:underline text-center md:text-right"
        >
          Privacy Policy
        </a>
      </div>
    </footer>
  );
};

export default Footer;
