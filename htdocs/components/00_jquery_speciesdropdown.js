/*
 * Copyright [1999-2014] Wellcome Trust Sanger Institute and the EMBL-European Bioinformatics Institute
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * speciesDropdown: Javascript counterpart for E::W::Form::Element::SpeciesDropdown
 * Extension of filterableDropdown to add species icons to the tags
 * Reserverd classname prefix: _sdd
 **/
(function ($) {
  $.fn.speciesDropdown = function (options) {
  /*
   * options: same as accepted by filterableDropdown, except 'change' key
   */

    return this.each(function () {
      $.speciesDropdown($(this), options);
    });
  };

  $.speciesDropdown = function (el, options) {
    $.filterableDropdown(el, $.extend(options, {
      'change': function() {
        $(this).find('._fd_tag').css('background-image', function() {
          return this.style.backgroundImage.replace(/[^\/]+\.png/, $($(this).data('input')).val() + '.png');
        });
      }
    }));
  };
})(jQuery);