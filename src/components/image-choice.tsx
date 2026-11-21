/**
 * How the approved product gets its catalogue image (D38): upload one, copy a photo from the
 * shop page (only with the brand's permission), or keep the drawing. Plain radios, so it works
 * before the page hydrates.
 */
export function ImageChoice({ pagePhotos, name }: { pagePhotos: string[]; name: string }) {
  return (
    <fieldset className="image-choice">
      <legend>Catalogue image</legend>
      <label className="option">
        <input type="radio" name="photo" value="upload" />
        <span>Upload an image</span>
      </label>
      <input type="file" name="image" accept="image/webp,image/png,image/jpeg" aria-label="Image to upload" />
      <small>WebP, PNG or JPG, up to 2 MB, on a plain background.</small>

      {pagePhotos.length > 0 && (
        <>
          <span className="option-title">Or use a photo from the shop page</span>
          <div className="page-photos">
            {pagePhotos.map((src, i) => (
              <label key={src} className="page-photo">
                <input type="radio" name="photo" value={`page:${i}`} aria-label={`Shop photo ${i + 1} of ${name}`} />
                {/* eslint-disable-next-line @next/next/no-img-element -- remote shop images, shown for reference */}
                <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" />
              </label>
            ))}
          </div>
          <label className="option">
            <input type="checkbox" name="permission" />
            <span>The brand or shop allows us to use this photo</span>
          </label>
          <small>We store our own copy. Only https WebP, PNG or JPG up to 2 MB.</small>
        </>
      )}

      <label className="option">
        <input type="radio" name="photo" value="none" defaultChecked />
        <span>No image for now</span>
      </label>
      <small>It shows as a drawing. You can add an image on the product page later.</small>
    </fieldset>
  );
}
