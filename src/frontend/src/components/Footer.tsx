import { ExternalLink, Heart, Phone } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="bg-navy text-on-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand + mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-teal rounded-full p-1.5">
                <Heart
                  className="h-5 w-5 text-white fill-white"
                  aria-hidden="true"
                />
              </div>
              <span className="font-bold text-lg text-white">
                Live Now Recovery
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Built by a peer 8-years clean. Your data is never stored. You are
              not alone.
            </p>
            <p className="text-xs">
              &copy; {year} Live Now Recovery LLC | Ohio Region 13
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="tel:8332346343"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                  data-ocid="footer.emergency.link"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Ohio MAR NOW: 833-234-6343
                </a>
              </li>
              <li>
                <a
                  href="https://costplusdrugs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                  data-ocid="footer.costplus.link"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Mark Cuban Cost Plus Drugs
                </a>
              </li>
              <li>
                <a
                  href="https://www.samhsa.gov/find-help/national-helpline"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                  data-ocid="footer.samhsa.link"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  SAMHSA National Helpline
                </a>
              </li>
            </ul>
          </div>

          {/* Emergency CTA */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">
              Need Help Now?
            </h3>
            <p className="text-sm leading-relaxed">
              If you or someone you know is in crisis, please reach out
              immediately.
            </p>
            <a
              href="tel:8332346343"
              className="inline-flex items-center gap-2 bg-emergency hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors"
              data-ocid="footer.talk_to_peer.button"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              TALK TO A PEER NOW
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>
            This platform does not store protected health information (PHI).
          </p>
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            Built with{" "}
            <Heart
              className="h-3 w-3 text-emergency fill-emergency mx-0.5"
              aria-hidden="true"
            />{" "}
            using caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
